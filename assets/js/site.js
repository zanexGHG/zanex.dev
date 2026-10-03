import {PROJECTS, STACK, LINKS, DOMAIN_SINCE} from './config.js';
import {languageColor} from './languages.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const ICONS = {
    chevronRight: ['m9 18 6-6-6-6'],
    arrowUpRight: ['M7 7h10v10', 'M7 17 17 7'],
    flask: [
        'M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2',
        'M6.453 15h11.094',
        'M8.5 2h7'
    ]
};

function icon(paths, cls) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    if (cls) {
        svg.setAttribute('class', cls);
    }

    for (const d of paths) {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
    }

    return svg;
}

function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) {
        n.className = cls;
    }

    if (text != null) {
        n.textContent = text;
    }

    return n;
}

const RUNES = [...'ʖᓵ↸ᒷ⎓⊣⋮ꖌꖎᒲᑑ∷ᓭ∴⨅ᑊ⌇⋔'];
const CELL_EM = 1.25;
const glyphScale = new Map();

function measureRunes(sample) {
    if (glyphScale.size) {
        return;
    }

    const style = getComputedStyle(sample);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const unit = ctx.measureText('0').width || 1;
    for (const glyph of RUNES) {
        glyphScale.set(glyph, Math.min(1, unit / (ctx.measureText(glyph).width || unit)));
    }
}


function reelFace(text, scale) {
    const span = document.createElement('span');
    span.textContent = text;

    if (scale != null) {
        span.style.scale = String(scale);
    }

    return span;
}

function runify(node, primed) {
    const text = node.textContent;
    node.textContent = '';
    node.classList.add('runic');

    const cells = [...text].map((ch) => {
        const cell = document.createElement('span');
        cell.className = 'rune-cell';

        if (ch === ' ') {
            cell.classList.add('is-space');
        }

        const reel = document.createElement('span');
        reel.className = 'rune-reel';
        reel.appendChild(reelFace(ch));
        cell.appendChild(reel);
        node.appendChild(cell);

        return {cell, reel, ch};
    });

    if (primed && !reduceMotion) {
        measureRunes(node);
        cells.forEach((cell) => {
            if (cell.ch === ' ') {
                return;
            }

            const glyph = RUNES[(Math.random() * RUNES.length) | 0];
            cell.reel.replaceChildren(reelFace(glyph, glyphScale.get(glyph)));
        });
    }

    let running = [];
    return function play(duration) {
        if (reduceMotion) {
            return;
        }

        measureRunes(node);
        running.forEach((a) => a.cancel());
        running = [];

        cells.forEach((cell, i) => {
            if (cell.ch === ' ') {
                return;
            }

            const spins = 6 + Math.floor(Math.random() * 6);
            cell.reel.textContent = '';

            for (let n = 0; n < spins; n++) {
                const glyph = RUNES[(Math.random() * RUNES.length) | 0];
                cell.reel.appendChild(reelFace(glyph, glyphScale.get(glyph)));
            }

            cell.reel.appendChild(reelFace(cell.ch));
            cell.cell.classList.add('is-rune');

            const anim = cell.reel.animate(
                [{transform: 'translateY(0)'}, {transform: `translateY(-${spins * CELL_EM}em)`}],
                {
                    duration: duration * 0.62,
                    delay: (i / Math.max(cells.length - 1, 1)) * duration * 0.38,
                    easing: 'cubic-bezier(.62,.02,.18,1)',
                    fill: 'both'
                }
            );

            anim.onfinish = () => {
                anim.cancel();
                cell.reel.replaceChildren(reelFace(cell.ch));
                cell.reel.style.transform = '';
                cell.cell.classList.remove('is-rune');
                cell.cell.classList.add('is-settling');
                setTimeout(() => cell.cell.classList.remove('is-settling'), 320);
            };

            running.push(anim);
        });
    };
}

const RUNE_COOLDOWN = 450;
function wireRuneHover(node, duration) {
    const play = runify(node);
    let readyAt = 0;

    const trigger = () => {
        const now = performance.now();
        if (now < readyAt) {
            return;
        }

        readyAt = now + duration + RUNE_COOLDOWN;
        play(duration);
    };

    node.addEventListener('mouseenter', trigger);
    node.addEventListener('focus', trigger);
    return play;
}

const CACHE_TTL = 30 * 60 * 1000;
function cached(key) {
    try {
        const raw = localStorage.getItem('gh:' + key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function store(key, data) {
    try {
        localStorage.setItem('gh:' + key, JSON.stringify({t: Date.now(), data}));
    } catch {}
}

async function gh(key, url, accept) {
    const hit = cached(key);
    if (hit && Date.now() - hit.t < CACHE_TTL) {
        return hit.data;
    }

    const res = await fetch(url, {headers: accept ? {Accept: accept} : {}});
    if (!res.ok) {
        if (hit) {
            return hit.data;
        }

        throw new Error(`GitHub ${res.status} for ${url}`);
    }

    const data = accept === 'application/vnd.github.raw' ? await res.text() : await res.json();
    store(key, data);

    return data;
}

const SAFE_SCHEME = /^https?:\/\//i;
function resolveUrl(src, base) {
    try {
        const url = new URL(src, base);
        return SAFE_SCHEME.test(url.href) ? url.href : null;
    } catch {
        return null;
    }
}

function inline(target, text) {
    const pattern = /`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|!\[[^\]]*]\([^)]*\)|\[([^\]]+)]\(([^)\s]+)[^)]*\)/g;
    let last = 0, m;

    while ((m = pattern.exec(text))) {
        if (m.index > last) target.appendChild(document.createTextNode(text.slice(last, m.index)));
        last = pattern.lastIndex;

        if (m[1] !== undefined) {
            target.appendChild(el('code', null, m[1]));
        } else if (m[2] !== undefined || m[3] !== undefined) {
            target.appendChild(el('strong', null, m[2] ?? m[3]));
        } else if (m[4] !== undefined || m[5] !== undefined) {
            target.appendChild(el('em', null, m[4] ?? m[5]));
        } else if (m[6] !== undefined) {
            if (SAFE_SCHEME.test(m[7])) {
                const a = el('a', null, m[6]);
                a.href = m[7];
                a.target = '_blank';
                a.rel = 'noreferrer noopener';
                target.appendChild(a);
            } else {
                target.appendChild(document.createTextNode(m[6]));
            }
        }
    }

    if (last < text.length) {
        target.appendChild(document.createTextNode(text.slice(last)));
    }
}

const TABLE_RULE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function tableCells(line) {
    return line
        .replace(/^\s*\|/, '')
        .replace(/\|\s*$/, '')
        .split(/(?<!\\)\|/)
        .map((cell) => cell.replace(/\\\|/g, '|').trim());
}

function columnAligns(rule) {
    return tableCells(rule).map((spec) => {
        if (/^:-+:$/.test(spec)) {
            return 'center';
        }

        if (/^-+:$/.test(spec)) {
            return 'right';
        }

        return '';
    });
}

function buildTable(lines, start) {
    const aligns = columnAligns(lines[start + 1]);
    const table = document.createElement('table');

    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    tableCells(lines[start]).forEach((text, i) => {
        const th = document.createElement('th');
        if (aligns[i]) {
            th.style.textAlign = aligns[i];
        }

        inline(th, text);
        headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);

    const body = document.createElement('tbody');
    let i = start + 2;
    for (; i < lines.length && lines[i].includes('|') && lines[i].trim(); i++) {
        const row = document.createElement('tr');
        tableCells(lines[i]).forEach((text, col) => {
            const td = document.createElement('td');
            if (aligns[col]) {
                td.style.textAlign = aligns[col];
            }

            inline(td, text);
            row.appendChild(td);
        });
        body.appendChild(row);
    }

    table.appendChild(body);

    const wrap = el('div', 'readme-table');
    wrap.appendChild(table);
    return {node: wrap, next: i - 1};
}

function renderMarkdown(md, base) {
    const root = document.createElement('div');
    const lines = md
        .replace(/\r\n/g, '\n')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<img\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi, '\n\n![]($1)\n\n')
        .replace(/<[^>]+>/g, '')
        .split('\n');

    let para = null, list = null;
    const flush = () => {
        para = null;
        list = null;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*```/.test(line)) {
            flush();
            const buf = [];
            while (++i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i]);
            const pre = document.createElement('pre');
            pre.appendChild(el('code', null, buf.join('\n')));
            root.appendChild(pre);
            continue;
        }

        if (!line.trim()) {
            flush();
            continue;
        }

        if (line.includes('|') && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1])) {
            flush();
            const table = buildTable(lines, i);
            root.appendChild(table.node);
            i = table.next;
            continue;
        }

        if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) {
            flush();
            root.appendChild(document.createElement('hr'));
            continue;
        }

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            flush();

            const h = document.createElement('h' + Math.min(heading[1].length + 2, 6));
            inline(h, heading[2].trim());
            root.appendChild(h);
            continue;
        }

        const bullet = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/);
        if (bullet) {
            para = null;
            if (!list) {
                list = document.createElement('ul');
                root.appendChild(list);
            }

            const li = document.createElement('li');
            inline(li, bullet[1]);
            list.appendChild(li);
            continue;
        }

        const quote = line.match(/^\s*>\s?(.*)$/);
        if (quote) {
            flush();

            const bq = document.createElement('blockquote');
            inline(bq, quote[1]);
            root.appendChild(bq);
            continue;
        }

        const image = line.trim().match(/^!\[([^\]]*)]\(([^)\s]+)[^)]*\)$/);
        if (image) {
            flush();

            const src = resolveUrl(image[2], base);
            if (src) {
                const img = el('img', 'readme-img');
                img.src = src;
                img.alt = image[1] || '';
                img.loading = 'lazy';
                img.addEventListener('error', () => img.remove());
                root.appendChild(img);
            }

            continue;
        }

        list = null;
        if (!para) {
            para = document.createElement('p');
            root.appendChild(para);
        } else {
            para.appendChild(document.createTextNode(' '));
        }

        inline(para, line.trim());
    }

    return root;
}

const LANG_LIMIT = 4;
let openProject = null;

function syncExpanded() {
    const list = document.getElementById('projects');
    if (list) {
        list.classList.toggle('has-open', Boolean(openProject));
    }

    const card = document.getElementById('card');
    if (!card) {
        return;
    }

    if (openProject) {
        card.style.left = '';
        card.style.top = '';
        card.style.transform = '';
    }

    card.classList.toggle('expanded', Boolean(openProject));
}

function collapseOpenProject() {
    if (!openProject) {
        return;
    }

    openProject.open(false);
    openProject = null;
    syncExpanded();
}

function languageRow(langs) {
    const row = el('div', 'langs');
    const entries = Object.entries(langs || {}).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
        return row;
    }

    const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
    entries.slice(0, LANG_LIMIT).forEach(([name, bytes], i) => {
        const chip = el('span', 'lang');
        chip.style.setProperty('--i', String(i));
        chip.style.setProperty('--lang', languageColor(name));
        chip.append(
            el('i', 'lang-dot'),
            el('span', 'lang-name', name),
            el('span', 'lang-pct', (bytes / total * 100).toFixed(0) + '%')
        );

        row.appendChild(chip);
    });

    return row;
}

function placeholderCard(cfg) {
    const card = el('article', 'project project-secret');

    const badge = el('div', 'project-logo project-logo-secret');
    badge.appendChild(icon(ICONS.flask));

    const title = el('span', 'project-name project-name-secret');
    title.appendChild(el('span', 'project-title-text', cfg.name || '???'));

    const desc = el('p', 'project-desc', cfg.description || '');

    const meta = el('div', 'project-meta');
    meta.append(title, desc);

    const head = el('div', 'project-head');
    head.append(badge, meta);
    card.append(head);

    return {card, desc, meta};
}

function projectCard(cfg) {
    const name = cfg.repo.split('/')[1];
    const card = el('article', 'project');

    const letter = () => el('div', 'project-logo project-logo-letter', name[0].toUpperCase());
    let logo;

    if (cfg.logo) {
        logo = el('img', 'project-logo');
        logo.alt = '';
        logo.loading = 'lazy';
        logo.src = cfg.logo;
        logo.addEventListener('error', () => logo.replaceWith(letter()));
    } else {
        logo = letter();
    }

    const title = el('a', 'project-name');
    title.href = `https://github.com/${cfg.repo}`;
    title.target = '_blank';
    title.rel = 'noreferrer noopener';
    title.append(el('span', 'project-title-text', cfg.name || name), icon(ICONS.arrowUpRight, 'ext'));

    const desc = el('p', 'project-desc', cfg.description || '…');
    const meta = el('div', 'project-meta');
    meta.append(title, desc);

    const head = el('div', 'project-head');
    head.append(logo, meta);

    if (cfg.readme === false) {
        card.append(head);
        return {card, desc, meta};
    }

    const toggle = el('button', 'project-expand');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'show readme');
    toggle.append(icon(ICONS.chevronRight));
    head.append(toggle);
    card.append(head);

    const wrap = el('div', 'readme-wrap');
    const inner = el('div', 'readme-inner');
    wrap.appendChild(inner);
    card.append(wrap);

    let loaded = false;
    async function load() {
        if (loaded) {
            return;
        }

        loaded = true;
        inner.append(el('p', 'readme-status', 'loading readme…'));

        try {
            const md = await gh(
                cfg.repo + ':readme',
                `https://api.github.com/repos/${cfg.repo}/readme`,
                'application/vnd.github.raw'
            );

            inner.textContent = '';
            inner.appendChild(renderMarkdown(md, `https://raw.githubusercontent.com/${cfg.repo}/HEAD/`));
        } catch {
            inner.textContent = '';

            const miss = el('p', 'readme-status', 'could not load the readme — ');
            const a = el('a', null, 'read it on github ↗');
            a.href = `https://github.com/${cfg.repo}#readme`;
            a.target = '_blank';
            a.rel = 'noreferrer noopener';

            miss.appendChild(a);
            inner.appendChild(miss);
        }
    }

    function setOpen(open) {
        card.classList.toggle('is-open', open);
        wrap.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'hide readme' : 'show readme');

        if (open) {
            load();
        }
    }

    card.open = setOpen;
    card.addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            return;
        }

        const open = toggle.getAttribute('aria-expanded') !== 'true';
        if (openProject && openProject !== card) {
            openProject.open(false);
        }

        setOpen(open);
        openProject = open ? card : null;
        syncExpanded();
        if (open) {
            requestAnimationFrame(() => card.scrollIntoView({block: 'nearest', behavior: 'smooth'}));
        }
    });

    return {card, desc, meta};
}

async function hydrate(cfg, parts) {
    try {
        const [repo, langs] = await Promise.all([
            gh(cfg.repo, `https://api.github.com/repos/${cfg.repo}`),
            gh(cfg.repo + ':langs', `https://api.github.com/repos/${cfg.repo}/languages`)
        ]);

        parts.desc.textContent = cfg.description || repo.description || 'no description yet.';
        parts.meta.appendChild(languageRow(langs));
    } catch {
        parts.desc.textContent = cfg.description || 'github is unreachable right now.';
    } finally {
        parts.card.classList.remove('is-loading');
    }
}

function renderProjects() {
    const list = document.getElementById('projects');
    if (!list) {
        return;
    }

    list.textContent = '';

    PROJECTS.forEach((cfg, i) => {
        const parts = cfg.placeholder ? placeholderCard(cfg) : projectCard(cfg);
        parts.card.classList.add('reveal');
        parts.card.style.setProperty('--reveal-delay', `${80 + i * 70}ms`);

        list.appendChild(parts.card);

        if (!cfg.placeholder) {
            parts.card.classList.add('is-loading');
            hydrate(cfg, parts);
        }
    });
}

let current = null;

function playVideo(src, chip) {
    if (chip.querySelector('video')) {
        return;
    }

    const video = document.createElement('video');
    video.className = 'stack-video';
    video.src = src;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const done = () => {
        video.remove();
        chip.classList.remove('is-playing-video');
    };
    video.addEventListener('ended', done);
    video.addEventListener('error', done);

    chip.classList.add('is-playing-video');
    chip.appendChild(video);
    video.play().catch(done);
}

function playSound(src, chip) {
    if (current) {
        current.audio.pause();
        current.chip.classList.remove('is-playing');
    }

    const audio = new Audio(src);
    current = {audio, chip};
    chip.classList.add('is-playing');

    const done = () => {
        chip.classList.remove('is-playing');
        if (current && current.audio === audio) {
            current = null;
        }
    };
    audio.addEventListener('ended', done);
    audio.addEventListener('error', done);

    audio.play().catch(done);
}

function renderStack() {
    const root = document.getElementById('stack');
    if (!root) {
        return;
    }

    root.textContent = '';

    let n = 0;
    STACK.forEach((group) => {
        const section = el('div', 'stack-group');
        section.append(el('div', 'stack-group-label', group.group));

        const row = el('div', 'stack-row');
        group.items.forEach((item) => {
            const interactive = Boolean(item.sound || item.video);
            const chip = el(interactive ? 'button' : 'span', 'stack-item reveal');
            chip.style.setProperty('--reveal-delay', `${120 + n++ * 40}ms`);
            chip.title = item.label;

            if (item.muted) {
                chip.classList.add('stack-muted');
            }

            if (interactive) {
                chip.type = 'button';
                chip.classList.add('stack-button');
                chip.addEventListener('click', () => {
                    if (item.sound) {
                        playSound(item.sound, chip);
                    }

                    if (item.video) {
                        playVideo(item.video, chip);
                    }
                });
            }

            const img = el('img');
            img.src = item.icon;
            img.alt = item.label;
            img.loading = 'lazy';
            img.addEventListener('error', () => chip.replaceChildren(el('span', 'stack-text', item.label)));

            const slot = el('span', 'stack-icon');
            slot.appendChild(img);
            chip.append(slot, el('span', 'stack-label', item.label));
            row.appendChild(chip);
        });

        section.append(row);
        root.append(section);
    });
}

function renderBadges() {
    const root = document.getElementById('badges');
    if (!root) {
        return;
    }

    root.textContent = '';

    let n = 0;
    LINKS.forEach((row) => {
        const line = el('div', 'badge-row');
        row.forEach((item) => {
            const a = el('a', 'badge reveal');
            a.href = item.href;
            a.target = '_blank';
            a.rel = 'noreferrer noopener';
            a.style.setProperty('--reveal-delay', `${140 + n++ * 55}ms`);

            const img = el('img');
            img.src = item.icon;
            img.alt = '';
            img.loading = 'lazy';
            img.addEventListener('error', () => img.remove());

            a.append(img, el('span', 'badge-label', item.label));
            line.appendChild(a);
        });

        root.appendChild(line);
    });
}

function renderFooter() {
    const node = document.getElementById('copyright');
    if (!node) {
        return;
    }

    const now = new Date().getFullYear();
    node.textContent = `© ${DOMAIN_SINCE}${now > DOMAIN_SINCE ? '–' + now : ''} zanex.dev`;
}

function init() {
    const brand = document.querySelector('.brand');
    if (brand) {
        const play = runify(brand, true);
        if (!reduceMotion) {
            setTimeout(() => play(1600), 260);
        }
    }

    document.querySelectorAll('.links a').forEach((a) => wireRuneHover(a, 500));

    const shell = document.getElementById('card');
    if (shell) {
        shell.addEventListener('card:dragstart', collapseOpenProject);
    }

    renderBadges();
    renderProjects();
    renderStack();
    renderFooter();

    document.querySelectorAll('.reveal-on-load').forEach((n, i) => {
        n.style.setProperty('--reveal-delay', `${i * 70}ms`);
    });

    document.body.classList.add('ready');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
