import {RainRenderer, RENDER, isSoftwareRenderer} from './renderer.js';

const WALLPAPER = './assets/background.webp';
const HAS_FINE_POINTER = matchMedia('(pointer: fine)').matches;

const DESKTOP_TIERS = [
    {maxPixels: 2.3e6, fps: 60, low: false},
    {maxPixels: 1.2e6, fps: 40, low: false},
    {maxPixels: 0.6e6, fps: 30, low: true}
];

const TOUCH_TIERS = [
    {maxPixels: 1.1e6, fps: 24, low: false},
    {maxPixels: 0.7e6, fps: 24, low: false},
    {maxPixels: 0.45e6, fps: 20, low: true}
];

const FRAME_BUDGET_MS = 45;
const PANIC_MS = 240;
const SAMPLE_SIZE = 10;
const WARMUP_FRAMES = 5;
const STRIKES = 2;

let dragging = false;

function enableDragging(card) {
    if (!card) {
        return;
    }

    const DRAG_THRESHOLD = 5;
    let drag = null;

    card.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a,button')) {
            return;
        }

        const r = card.getBoundingClientRect();
        drag = {
            id: e.pointerId,
            dx: e.clientX - r.left,
            dy: e.clientY - r.top,
            x0: e.clientX,
            y0: e.clientY,
            moved: false
        };
        card.setPointerCapture(e.pointerId);
    });

    card.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) {
            return;
        }

        if (!drag.moved) {
            if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < DRAG_THRESHOLD) {
                return;
            }

            drag.moved = true;
            dragging = true;
            card.classList.add('is-dragging');
            card.dispatchEvent(new CustomEvent('card:dragstart'));

            const r = card.getBoundingClientRect();
            drag.dx = Math.min(drag.dx, r.width - 24);
            drag.dy = Math.min(drag.dy, r.height - 24);
        }

        const r = card.getBoundingClientRect();
        card.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, e.clientX - drag.dx)) + 'px';
        card.style.top = Math.max(8, Math.min(innerHeight - r.height - 8, e.clientY - drag.dy)) + 'px';
        card.style.transform = 'none';
    });

    const stop = (e) => {
        if (!drag || e.pointerId !== drag.id) {
            return;
        }

        drag = null;
        dragging = false;
        card.classList.remove('is-dragging');
    };

    card.addEventListener('pointerup', stop);
    card.addEventListener('pointercancel', stop);
}

function fail(message) {
    const canvas = document.getElementById('gl');
    if (canvas) {
        canvas.style.display = 'none';
    }

    document.body.classList.remove('rain-ready');
    document.body.classList.add('no-rain');
    console.warn('[rain]', message);
}

async function boot() {
    const draggable = HAS_FINE_POINTER && innerWidth > 760;

    if (draggable) {
        enableDragging(document.getElementById('card'));
    } else {
        document.body.classList.add('no-drag');
    }

    const canvas = document.getElementById('gl');
    if (!canvas) {
        return;
    }

    const TIERS = draggable ? DESKTOP_TIERS : TOUCH_TIERS;

    let renderer;
    try {
        renderer = new RainRenderer(canvas);

        if (isSoftwareRenderer(renderer.gl)) {
            renderer.destroy();
            fail('no hardware gpu, keeping the static backdrop');
            return;
        }

        await renderer.init(WALLPAPER);
    } catch (err) {
        fail(err.message);
        return;
    }

    const start = performance.now();
    let tier = -1;
    let minFrameMs = 1000 / TIERS[0].fps;
    let lastDraw = -Infinity;
    let probeAt = 0;
    let samples = [];
    let strikes = 0;
    let warmup = WARMUP_FRAMES;
    let running = true;

    function applyTier(next) {
        if (next >= TIERS.length) {
            running = false;
            renderer.destroy();
            fail('shader too slow here, keeping the static backdrop');
            return;
        }

        tier = next;
        const level = TIERS[tier];
        RENDER.maxPixels = level.maxPixels;
        RENDER.fps = level.fps;
        minFrameMs = 1000 / level.fps;
        renderer.setLowQuality(level.low);
        renderer.needsResize = true;
        canvas.dataset.tier = String(tier);

        lastDraw = -Infinity;
        probeAt = 0;
        samples = [];
        strikes = 0;
        warmup = WARMUP_FRAMES;
    }

    function sample(dt) {
        if (dragging || document.hidden) {
            return;
        }

        if (warmup > 0) {
            warmup--;
            return;
        }

        if (dt >= PANIC_MS) {
            applyTier(tier + 1);
            return;
        }

        samples.push(dt);
        if (samples.length < SAMPLE_SIZE) {
            return;
        }

        const median = samples.slice().sort((a, b) => a - b)[SAMPLE_SIZE >> 1];
        samples = [];

        if (median <= FRAME_BUDGET_MS) {
            strikes = 0;
            return;
        }

        if (++strikes >= STRIKES) {
            applyTier(tier + 1);
        }
    }

    const resume = () => {
        if (running) {
            return;
        }

        running = true;
        lastDraw = -Infinity;
        probeAt = 0;
        samples = [];
        warmup = WARMUP_FRAMES;
        requestAnimationFrame(frame);
    };

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            running = false;
        } else if (renderer.ready) {
            resume();
        }
    });

    function frame(now) {
        if (!running) {
            return;
        }

        if (probeAt) {
            const since = probeAt;
            probeAt = 0;
            sample(now - since);

            if (!running) {
                return;
            }
        }

        if (now - lastDraw >= minFrameMs) {
            lastDraw = now;
            probeAt = now;
            renderer.draw((now - start) / 1000);
        }

        requestAnimationFrame(frame);
    }

    applyTier(0);
    document.body.classList.add('rain-ready');
    requestAnimationFrame(frame);
}

boot();
