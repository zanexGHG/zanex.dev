import {RainRenderer, RENDER} from './renderer.js';

const WALLPAPER = './assets/background.jpg';

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

    document.body.classList.add('no-rain');
    console.warn('[rain]', message);
}

async function boot() {
    enableDragging(document.getElementById('card'));

    const canvas = document.getElementById('gl');
    if (!canvas) {
        return;
    }

    let renderer;
    try {
        renderer = new RainRenderer(canvas);
        await renderer.init(WALLPAPER);
    } catch (err) {
        fail(err.message);
        return;
    }

    const start = performance.now();
    const minFrameMs = 1000 / RENDER.fps;
    let lastDraw = -Infinity;
    let running = true;
    const resume = () => {
        if (running) {
            return;
        }

        running = true;
        requestAnimationFrame(frame);
    };

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            running = false;
        } else {
            resume();
        }
    });

    function frame(now) {
        if (!running) {
            return;
        }

        if (now - lastDraw >= minFrameMs) {
            lastDraw = now;
            renderer.draw((now - start) / 1000);
        }

        requestAnimationFrame(frame);
    }

    document.body.classList.add('rain-ready');
    requestAnimationFrame(frame);
}

boot();
