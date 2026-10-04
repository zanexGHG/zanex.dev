const SHADERS = './assets/shader/';

export const RENDER = {
    maxDpr: 1.0,
    maxPixels: 2.3e6,
    fps: 60,
    blur: 0.45,
    staticDrops: 0.35,
    rollingDrops: 0.35,
    speed: 1.0,
    distortion: 1.25,
    dim: 0.92
};

const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|soft\s*pipe|basic\s*render|software\s*rasteriz|microsoft basic display/i;

export function isSoftwareRenderer(gl) {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    if (!info) {
        return false;
    }

    const name = gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '';
    return SOFTWARE_GPU.test(String(name));
}

async function loadShader(name) {
    const res = await fetch(SHADERS + name);
    if (!res.ok) {
        throw new Error(`shader ${name}: ${res.status}`);
    }

    return res.text();
}

function withDefines(src, defines) {
    if (!defines.length) {
        return src;
    }

    const lines = src.split('\n');
    const at = lines[0].startsWith('#version') ? 1 : 0;
    lines.splice(at, 0, ...defines.map((d) => `#define ${d}`));

    return lines.join('\n');
}

function compile(gl, type, src, name) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`${name}\n${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
}

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
const UNIFORMS = [
    'uRes', 'uResCss', 'uTime', 'uBg', 'uTexSize', 'uImageAR',
    'uBlur', 'uStaticDrops', 'uRollingDrops', 'uSpeed', 'uDistortion', 'uDim'
];

export class RainRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,
            depth: false,
            premultipliedAlpha: false,
            powerPreference: 'high-performance'
        });

        if (!this.gl) {
            throw new Error('WebGL2 unavailable');
        }

        this.ready = false;
        this.lowQuality = false;
        this.needsResize = true;
        this.onResize = () => {
            this.needsResize = true;
        };

        addEventListener('resize', this.onResize, {passive: true});
    }

    async init(imageUrl) {
        const gl = this.gl;
        [this.vertSrc, this.fragSrc] = await Promise.all([
            loadShader('fullscreen.vert'),
            loadShader('rain.frag')
        ]);

        this.buildProgram();

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
        this.bindQuad();

        await this.loadWallpaper(imageUrl);
        gl.uniform1i(this.U.uBg, 0);
        this.ready = true;
    }

    buildProgram() {
        const gl = this.gl;
        const defines = this.lowQuality ? ['LOW_QUALITY'] : [];

        const program = gl.createProgram();
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, withDefines(this.vertSrc, defines), 'fullscreen.vert'));
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, withDefines(this.fragSrc, defines), 'rain.frag'));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }

        if (this.program) {
            gl.deleteProgram(this.program);
        }

        gl.useProgram(program);
        this.program = program;

        this.U = {};
        for (const name of UNIFORMS) {
            this.U[name] = gl.getUniformLocation(program, name);
        }
    }

    bindQuad() {
        const gl = this.gl;
        const aPos = gl.getAttribLocation(this.program, 'aPos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    }

    // Swaps in the cheap shader variant (fewer blur taps, cheap noise, no chromatic aberration). Returns false when nothing changed.
    setLowQuality(low) {
        if (this.lowQuality === low || !this.vertSrc) {
            return false;
        }

        this.lowQuality = low;
        this.buildProgram();
        this.bindQuad();
        this.gl.uniform1i(this.U.uBg, 0);
        this.needsResize = true;

        return true;
    }

    destroy() {
        removeEventListener('resize', this.onResize);
        this.ready = false;

        const lose = this.gl.getExtension('WEBGL_lose_context');
        if (lose) {
            lose.loseContext();
        }
    }

    loadWallpaper(url) {
        const gl = this.gl;
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                this.texW = image.naturalWidth;
                this.texH = image.naturalHeight;
                this.imageAR = this.texW / this.texH;

                const tex = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, tex);

                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

                gl.generateMipmap(gl.TEXTURE_2D);
                resolve();
            };

            image.onerror = () => reject(new Error(`wallpaper failed to load: ${url}`));
            image.src = url;
        });
    }

    resize() {
        const dpr = Math.min(devicePixelRatio || 1, RENDER.maxDpr);
        let width = innerWidth * dpr;
        let height = innerHeight * dpr;

        const over = (width * height) / RENDER.maxPixels;
        if (over > 1) {
            const k = Math.sqrt(over);
            width /= k;
            height /= k;
        }

        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }

        this.gl.viewport(0, 0, width, height);
        this.cssW = innerWidth;
        this.cssH = innerHeight;
    }

    draw(seconds) {
        if (!this.ready) return;
        const gl = this.gl;

        if (this.needsResize) {
            this.needsResize = false;
            this.resize();
        }

        gl.uniform2f(this.U.uRes, this.canvas.width, this.canvas.height);
        gl.uniform2f(this.U.uResCss, this.cssW, this.cssH);
        gl.uniform1f(this.U.uTime, seconds);
        gl.uniform2f(this.U.uTexSize, this.texW, this.texH);
        gl.uniform1f(this.U.uImageAR, this.imageAR);
        gl.uniform1f(this.U.uBlur, RENDER.blur);
        gl.uniform1f(this.U.uStaticDrops, RENDER.staticDrops);
        gl.uniform1f(this.U.uRollingDrops, RENDER.rollingDrops);
        gl.uniform1f(this.U.uSpeed, RENDER.speed);
        gl.uniform1f(this.U.uDistortion, RENDER.distortion);
        gl.uniform1f(this.U.uDim, RENDER.dim);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
