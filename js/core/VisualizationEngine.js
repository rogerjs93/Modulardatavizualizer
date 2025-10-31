/**
 * 🎨 VisualizationEngine
 * 
 * WebGL-based rendering engine for modular visualizations.
 * Handles different visualization types and GPU-accelerated rendering.
 */

export class VisualizationEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.currentViz = null;
        this.animationId = null;
        this.parameters = {};
        
        this.initWebGL();
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Initialize WebGL context
     */
    initWebGL() {
        const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        
        if (!gl) {
            console.error('WebGL not supported');
            this.fallbackTo2D();
            return;
        }
        
        this.gl = gl;
        console.log('✅ WebGL initialized');
        
        // Set up basic GL state
        gl.clearColor(0.06, 0.09, 0.16, 1.0); // Dark background
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    /**
     * Fallback to 2D canvas if WebGL fails
     */
    fallbackTo2D() {
        this.ctx = this.canvas.getContext('2d');
        console.log('⚠️ Falling back to 2D canvas');
    }

    /**
     * Resize canvas to fill container
     */
    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Load visualization module based on type
     */
    async loadVisualization(type, data) {
        // Stop current animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        console.log(`🎨 Loading visualization: ${type}`);

        switch (type) {
            case 'waveform':
                this.currentViz = new WaveformViz(this.gl || this.ctx, data);
                break;
            case 'spectrogram':
                this.currentViz = new SpectrogramViz(this.gl || this.ctx, data);
                break;
            case 'timeseries':
                this.currentViz = new TimeSeriesViz(this.gl || this.ctx, data);
                break;
            case 'heatmap':
                this.currentViz = new HeatmapViz(this.gl || this.ctx, data);
                break;
            case '3d-brain':
                this.currentViz = new Brain3DViz(this.gl, data);
                break;
            default:
                console.warn(`Visualization type ${type} not implemented yet`);
                this.currentViz = new DefaultViz(this.gl || this.ctx, data);
        }

        // Get default parameters
        this.parameters = this.currentViz.getDefaultParameters();
        
        // Start animation loop
        this.startAnimation();
        
        return this.parameters;
    }

    /**
     * Update visualization parameters
     */
    updateParameters(params) {
        this.parameters = { ...this.parameters, ...params };
        if (this.currentViz) {
            this.currentViz.updateParameters(this.parameters);
        }
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        const animate = (timestamp) => {
            if (this.currentViz) {
                this.currentViz.render(timestamp);
            }
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    /**
     * Stop animation
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Get current FPS
     */
    getFPS() {
        return this.currentViz ? this.currentViz.fps : 0;
    }
}

/**
 * 🌊 Waveform Visualization
 */
class WaveformViz {
    constructor(gl, data) {
        this.gl = gl;
        this.data = data;
        this.params = {
            amplitude: 1.0,
            color: [0.4, 0.7, 1.0, 1.0],
            lineWidth: 2.0,
            timeWindow: 1.0,
            offset: 0
        };
        
        this.fps = 60;
        this.lastTime = 0;
        
        if (gl && gl.createShader) {
            this.initWebGLBuffers();
        }
    }

    initWebGLBuffers() {
        const gl = this.gl;
        
        // Vertex shader
        const vsSource = `
            attribute vec2 aPosition;
            uniform float uAmplitude;
            void main() {
                gl_Position = vec4(aPosition.x, aPosition.y * uAmplitude, 0.0, 1.0);
            }
        `;
        
        // Fragment shader
        const fsSource = `
            precision mediump float;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = uColor;
            }
        `;
        
        this.program = this.createProgram(vsSource, fsSource);
        this.locations = {
            position: gl.getAttribLocation(this.program, 'aPosition'),
            amplitude: gl.getUniformLocation(this.program, 'uAmplitude'),
            color: gl.getUniformLocation(this.program, 'uColor')
        };
        
        // Create buffer
        this.buffer = gl.createBuffer();
    }

    createProgram(vsSource, fsSource) {
        const gl = this.gl;
        
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSource);
        gl.compileShader(vs);
        
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSource);
        gl.compileShader(fs);
        
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        
        return program;
    }

    render(timestamp) {
        const gl = this.gl;
        
        // Calculate FPS
        if (this.lastTime) {
            this.fps = Math.round(1000 / (timestamp - this.lastTime));
        }
        this.lastTime = timestamp;
        
        if (!gl || !gl.createShader) {
            this.render2D();
            return;
        }
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(this.program);
        
        // Prepare waveform data
        const channel = this.data.data.channels[0];
        const samples = Math.min(channel.length, 4096);
        const vertices = new Float32Array(samples * 2);
        
        for (let i = 0; i < samples; i++) {
            vertices[i * 2] = (i / samples) * 2 - 1;
            vertices[i * 2 + 1] = channel[i];
        }
        
        // Upload to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
        
        // Set attributes and uniforms
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(this.locations.amplitude, this.params.amplitude);
        gl.uniform4fv(this.locations.color, this.params.color);
        
        // Draw
        gl.drawArrays(gl.LINE_STRIP, 0, samples);
    }

    render2D() {
        const ctx = this.gl;
        const canvas = ctx.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = `rgba(${this.params.color.map(c => c * 255).join(',')})`;
        ctx.lineWidth = this.params.lineWidth;
        
        const channel = this.data.data.channels[0];
        const samples = Math.min(channel.length, 4096);
        
        ctx.beginPath();
        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * canvas.width;
            const y = (0.5 - channel[i] * 0.5 * this.params.amplitude) * canvas.height;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    updateParameters(params) {
        this.params = { ...this.params, ...params };
    }

    getDefaultParameters() {
        return {
            amplitude: { value: 1.0, min: 0.1, max: 5.0, step: 0.1, label: 'Amplitude' },
            lineWidth: { value: 2.0, min: 0.5, max: 10, step: 0.5, label: 'Line Width' }
        };
    }
}

/**
 * 📊 Time Series Visualization
 */
class TimeSeriesViz {
    constructor(ctx, data) {
        this.ctx = ctx;
        this.data = data;
        this.params = {
            channels: data.data.channels.length,
            spacing: 1.0,
            timeScale: 1.0
        };
        this.fps = 60;
        this.lastTime = 0;
    }

    render(timestamp) {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        
        if (this.lastTime) {
            this.fps = Math.round(1000 / (timestamp - this.lastTime));
        }
        this.lastTime = timestamp;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const channels = this.data.data.channels;
        const numChannels = channels.length;
        const channelHeight = canvas.height / numChannels;
        
        channels.forEach((channel, idx) => {
            const samples = Math.min(channel.length, 2048);
            const yOffset = (idx + 0.5) * channelHeight;
            const scale = (channelHeight / 2) * 0.8;
            
            ctx.strokeStyle = `hsl(${(idx / numChannels) * 360}, 70%, 60%)`;
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            for (let i = 0; i < samples; i++) {
                const x = (i / samples) * canvas.width;
                const y = yOffset - channel[i] * scale * this.params.spacing;
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            
            // Channel label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px monospace';
            ctx.fillText(`Ch ${idx + 1}`, 10, yOffset - channelHeight / 2 + 15);
        });
    }

    updateParameters(params) {
        this.params = { ...this.params, ...params };
    }

    getDefaultParameters() {
        return {
            spacing: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: 'Channel Spacing' },
            timeScale: { value: 1.0, min: 0.1, max: 10, step: 0.1, label: 'Time Scale' }
        };
    }
}

/**
 * 🔥 Default fallback visualization
 */
class DefaultViz {
    constructor(ctx, data) {
        this.ctx = ctx;
        this.data = data;
        this.fps = 60;
    }

    render(timestamp) {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Visualization loading...', canvas.width / 2, canvas.height / 2);
    }

    updateParameters() {}
    getDefaultParameters() { return {}; }
}
