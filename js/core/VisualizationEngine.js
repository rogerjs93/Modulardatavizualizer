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
            case '3d-mesh':
                this.currentViz = new Mesh3DViz(this.gl || this.ctx, data);
                break;
            case '3d-pointcloud':
                this.currentViz = new PointCloud3DViz(this.gl || this.ctx, data);
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

/**
 * 📐 3D Mesh Visualization (OBJ, STL, PLY)
 */
class Mesh3DViz {
    constructor(gl, data) {
        this.gl = gl;
        this.ctx = gl; // Fallback
        this.data = data;
        this.params = {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            scale: 1.0,
            wireframe: false,
            autoRotate: true
        };
        
        this.fps = 60;
        this.lastTime = 0;
        this.rotation = 0;
        
        // Mouse interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.userRotationX = 0;
        this.userRotationY = 0;
        this.userScale = 1.0;
        
        if (gl && gl.createShader) {
            this.initWebGL3D();
            this.initMouseControls();
        }
    }

    /**
     * Initialize mouse controls for 3D interaction
     */
    initMouseControls() {
        const canvas = this.gl.canvas;
        
        // Mouse down - start dragging
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            canvas.style.cursor = 'grabbing';
            
            // Disable auto-rotate when user interacts
            if (this.params.autoRotate) {
                this.params.autoRotate = false;
            }
        });
        
        // Mouse move - rotate
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.userRotationY += deltaX * 0.01;
            this.userRotationX += deltaY * 0.01;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        // Mouse up - stop dragging
        const stopDragging = () => {
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        };
        
        canvas.addEventListener('mouseup', stopDragging);
        canvas.addEventListener('mouseleave', stopDragging);
        
        // Mouse wheel - zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomSpeed = 0.001;
            this.userScale -= e.deltaY * zoomSpeed;
            this.userScale = Math.max(0.1, Math.min(5.0, this.userScale));
        }, { passive: false });
        
        // Touch support for mobile
        let lastTouchDistance = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
                this.params.autoRotate = false;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.isDragging) {
                const deltaX = e.touches[0].clientX - this.lastMouseX;
                const deltaY = e.touches[0].clientY - this.lastMouseY;
                
                this.userRotationY += deltaX * 0.01;
                this.userRotationX += deltaY * 0.01;
                
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const delta = distance - lastTouchDistance;
                this.userScale += delta * 0.01;
                this.userScale = Math.max(0.1, Math.min(5.0, this.userScale));
                
                lastTouchDistance = distance;
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
        
        // Set initial cursor
        canvas.style.cursor = 'grab';
    }

    initWebGL3D() {
        const gl = this.gl;
        
        // Vertex shader for 3D
        const vsSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vec4 pos = uModelViewMatrix * vec4(aPosition, 1.0);
                gl_Position = uProjectionMatrix * pos;
                vPosition = pos.xyz;
                vNormal = (uNormalMatrix * vec4(aNormal, 0.0)).xyz;
            }
        `;
        
        // Fragment shader with simple lighting
        const fsSource = `
            precision mediump float;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            uniform vec3 uLightDirection;
            uniform vec3 uColor;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(uLightDirection);
                
                float diffuse = max(dot(normal, lightDir), 0.0);
                float ambient = 0.3;
                
                vec3 color = uColor * (ambient + diffuse * 0.7);
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        this.program = this.createProgram(vsSource, fsSource);
        this.locations = {
            position: gl.getAttribLocation(this.program, 'aPosition'),
            normal: gl.getAttribLocation(this.program, 'aNormal'),
            modelViewMatrix: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            normalMatrix: gl.getUniformLocation(this.program, 'uNormalMatrix'),
            lightDirection: gl.getUniformLocation(this.program, 'uLightDirection'),
            color: gl.getUniformLocation(this.program, 'uColor')
        };
        
        this.prepareBuffers();
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

    prepareBuffers() {
        const gl = this.gl;
        const meshData = this.data.data;
        
        // Convert mesh data to flat arrays
        const vertices = [];
        const normals = [];
        
        if (meshData.format === 'obj') {
            // Handle OBJ format
            meshData.faces.forEach(face => {
                // Triangulate if needed
                for (let i = 1; i < face.length - 1; i++) {
                    [0, i, i + 1].forEach(idx => {
                        const v = meshData.vertices[face[idx].v];
                        vertices.push(...v);
                        
                        if (face[idx].vn !== null && meshData.normals[face[idx].vn]) {
                            const n = meshData.normals[face[idx].vn];
                            normals.push(...n);
                        } else {
                            normals.push(0, 0, 1); // Default normal
                        }
                    });
                }
            });
        } else if (meshData.format === 'stl') {
            // STL already has flat vertices
            meshData.vertices.forEach((v, i) => {
                vertices.push(...v);
                normals.push(...meshData.normals[i]);
            });
        } else if (meshData.format === 'ply') {
            // Handle PLY format
            meshData.faces.forEach(face => {
                for (let i = 1; i < face.length - 1; i++) {
                    [0, i, i + 1].forEach(idx => {
                        const v = meshData.vertices[face[idx]];
                        vertices.push(...v);
                        normals.push(0, 0, 1); // Compute normals later
                    });
                }
            });
        }
        
        // Create buffers
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        
        this.vertexCount = vertices.length / 3;
    }

    render(timestamp) {
        const gl = this.gl;
        
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
        
        // Auto-rotate
        if (this.params.autoRotate) {
            this.rotation += 0.01;
        }
        
        // Create matrices
        const projectionMatrix = this.createPerspectiveMatrix(
            Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0
        );
        
        const modelViewMatrix = this.createModelViewMatrix();
        const normalMatrix = this.createNormalMatrix(modelViewMatrix);
        
        // Set uniforms
        gl.uniformMatrix4fv(this.locations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.locations.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(this.locations.normalMatrix, false, normalMatrix);
        gl.uniform3fv(this.locations.lightDirection, [0.5, 0.7, 1.0]);
        gl.uniform3fv(this.locations.color, [0.4, 0.7, 1.0]);
        
        // Bind buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(this.locations.normal);
        gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }

    render2D() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('3D Mesh Loaded', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        const format = this.data.data.format.toUpperCase();
        const verts = this.data.metadata.vertexCount || 0;
        ctx.fillText(`${format}: ${verts} vertices`, canvas.width / 2, canvas.height / 2 + 10);
    }

    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const rangeInv = 1 / (near - far);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }

    createModelViewMatrix() {
        // Combine parameter rotations, auto-rotation, and user interaction
        const rx = this.params.rotationX + this.rotation + this.userRotationX;
        const ry = this.params.rotationY + this.rotation + this.userRotationY;
        const s = this.params.scale * this.userScale;
        
        // Simple rotation and scale matrix
        const cx = Math.cos(rx), sx = Math.sin(rx);
        const cy = Math.cos(ry), sy = Math.sin(ry);
        
        return new Float32Array([
            cy * s, 0, sy * s, 0,
            sx * sy * s, cx * s, -sx * cy * s, 0,
            -cx * sy * s, sx * s, cx * cy * s, 0,
            0, 0, -5, 1
        ]);
    }

    createNormalMatrix(modelViewMatrix) {
        // Simplified normal matrix (should be inverse transpose)
        return modelViewMatrix;
    }

    updateParameters(params) {
        this.params = { ...this.params, ...params };
    }

    getDefaultParameters() {
        return {
            scale: { value: 1.0, min: 0.1, max: 5.0, step: 0.1, label: 'Scale' },
            autoRotate: { value: true, type: 'checkbox', label: 'Auto Rotate' }
        };
    }
}

/**
 * ☁️ Point Cloud 3D Visualization
 */
class PointCloud3DViz {
    constructor(gl, data) {
        this.gl = gl;
        this.ctx = gl;
        this.data = data;
        this.params = {
            pointSize: 2.0,
            rotationX: 0,
            rotationY: 0,
            scale: 1.0,
            autoRotate: true
        };
        
        this.fps = 60;
        this.lastTime = 0;
        this.rotation = 0;
        
        // Mouse interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.userRotationX = 0;
        this.userRotationY = 0;
        this.userScale = 1.0;
        
        if (gl && gl.createShader) {
            this.initWebGL3D();
            this.initMouseControls();
        }
    }

    /**
     * Initialize mouse controls for 3D interaction
     */
    initMouseControls() {
        const canvas = this.gl.canvas;
        
        // Mouse down
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            canvas.style.cursor = 'grabbing';
            
            if (this.params.autoRotate) {
                this.params.autoRotate = false;
            }
        });
        
        // Mouse move
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.userRotationY += deltaX * 0.01;
            this.userRotationX += deltaY * 0.01;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        // Mouse up
        const stopDragging = () => {
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        };
        
        canvas.addEventListener('mouseup', stopDragging);
        canvas.addEventListener('mouseleave', stopDragging);
        
        // Mouse wheel - zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomSpeed = 0.001;
            this.userScale -= e.deltaY * zoomSpeed;
            this.userScale = Math.max(0.1, Math.min(5.0, this.userScale));
        }, { passive: false });
        
        // Touch support
        let lastTouchDistance = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
                this.params.autoRotate = false;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.isDragging) {
                const deltaX = e.touches[0].clientX - this.lastMouseX;
                const deltaY = e.touches[0].clientY - this.lastMouseY;
                
                this.userRotationY += deltaX * 0.01;
                this.userRotationX += deltaY * 0.01;
                
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const delta = distance - lastTouchDistance;
                this.userScale += delta * 0.01;
                this.userScale = Math.max(0.1, Math.min(5.0, this.userScale));
                
                lastTouchDistance = distance;
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
        
        canvas.style.cursor = 'grab';
    }

    initWebGL3D() {
        const gl = this.gl;
        
        const vsSource = `
            attribute vec3 aPosition;
            attribute vec3 aColor;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform float uPointSize;
            
            varying vec3 vColor;
            
            void main() {
                gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
                gl_PointSize = uPointSize;
                vColor = aColor;
            }
        `;
        
        const fsSource = `
            precision mediump float;
            varying vec3 vColor;
            
            void main() {
                gl_FragColor = vec4(vColor, 1.0);
            }
        `;
        
        this.program = this.createProgram(vsSource, fsSource);
        this.locations = {
            position: gl.getAttribLocation(this.program, 'aPosition'),
            color: gl.getAttribLocation(this.program, 'aColor'),
            modelViewMatrix: gl.getUniformLocation(this.program, 'uModelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.program, 'uProjectionMatrix'),
            pointSize: gl.getUniformLocation(this.program, 'uPointSize')
        };
        
        this.prepareBuffers();
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

    prepareBuffers() {
        const gl = this.gl;
        const cloudData = this.data.data;
        
        const vertices = [];
        const colors = [];
        
        cloudData.points.forEach((point, i) => {
            vertices.push(...point);
            
            if (cloudData.colors && cloudData.colors[i]) {
                colors.push(...cloudData.colors[i]);
            } else {
                // Default color gradient based on height
                const t = (point[2] + 1) / 2;
                colors.push(t, 0.5, 1 - t);
            }
        });
        
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        this.pointCount = cloudData.points.length;
    }

    render(timestamp) {
        const gl = this.gl;
        
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
        
        if (this.params.autoRotate) {
            this.rotation += 0.01;
        }
        
        const projectionMatrix = this.createPerspectiveMatrix(
            Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0
        );
        const modelViewMatrix = this.createModelViewMatrix();
        
        gl.uniformMatrix4fv(this.locations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.locations.modelViewMatrix, false, modelViewMatrix);
        gl.uniform1f(this.locations.pointSize, this.params.pointSize);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(this.locations.color);
        gl.vertexAttribPointer(this.locations.color, 3, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.POINTS, 0, this.pointCount);
    }

    render2D() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Point Cloud Loaded', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        const points = this.data.metadata.pointCount || 0;
        ctx.fillText(`${points} points`, canvas.width / 2, canvas.height / 2 + 10);
    }

    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const rangeInv = 1 / (near - far);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ]);
    }

    createModelViewMatrix() {
        // Combine parameter rotations, auto-rotation, and user interaction
        const rx = this.params.rotationX + this.rotation + this.userRotationX;
        const ry = this.params.rotationY + this.rotation + this.userRotationY;
        const s = this.params.scale * this.userScale;
        
        const cx = Math.cos(rx), sx = Math.sin(rx);
        const cy = Math.cos(ry), sy = Math.sin(ry);
        
        return new Float32Array([
            cy * s, 0, sy * s, 0,
            sx * sy * s, cx * s, -sx * cy * s, 0,
            -cx * sy * s, sx * s, cx * cy * s, 0,
            0, 0, -5, 1
        ]);
    }

    updateParameters(params) {
        this.params = { ...this.params, ...params };
    }

    getDefaultParameters() {
        return {
            pointSize: { value: 2.0, min: 0.5, max: 10.0, step: 0.5, label: 'Point Size' },
            scale: { value: 1.0, min: 0.1, max: 5.0, step: 0.1, label: 'Scale' },
            autoRotate: { value: true, type: 'checkbox', label: 'Auto Rotate' }
        };
    }
}

/**
 * 🧠 Brain 3D Volume Visualization (NIfTI)
 */
class Brain3DViz {
    constructor(gl, data) {
        this.gl = gl;
        this.ctx = gl;
        this.data = data;
        this.params = {
            sliceIndex: 0,
            sliceAxis: 'axial', // axial, coronal, sagittal
            brightness: 1.0,
            contrast: 1.0,
            colormap: 'grayscale',
            show3D: false,
            rotationX: 0,
            rotationY: 0
        };
        
        this.fps = 60;
        this.lastTime = 0;
        this.currentSlice = null;
        this.volumeData = data.data.volume;
        this.dimensions = data.metadata.dimensions;
        
        this.prepareSliceData();
    }

    prepareSliceData() {
        const axis = this.params.sliceAxis;
        const idx = this.params.sliceIndex;
        const vol = this.volumeData;
        const dims = this.dimensions;
        
        if (axis === 'axial') {
            // XY plane (slice through Z)
            const maxSlice = dims[2] - 1;
            const sliceIdx = Math.min(idx, maxSlice);
            this.currentSlice = {
                width: dims[0],
                height: dims[1],
                data: []
            };
            
            for (let y = 0; y < dims[1]; y++) {
                for (let x = 0; x < dims[0]; x++) {
                    const index = x + y * dims[0] + sliceIdx * dims[0] * dims[1];
                    this.currentSlice.data.push(vol[index] || 0);
                }
            }
        } else if (axis === 'coronal') {
            // XZ plane (slice through Y)
            const maxSlice = dims[1] - 1;
            const sliceIdx = Math.min(idx, maxSlice);
            this.currentSlice = {
                width: dims[0],
                height: dims[2],
                data: []
            };
            
            for (let z = 0; z < dims[2]; z++) {
                for (let x = 0; x < dims[0]; x++) {
                    const index = x + sliceIdx * dims[0] + z * dims[0] * dims[1];
                    this.currentSlice.data.push(vol[index] || 0);
                }
            }
        } else if (axis === 'sagittal') {
            // YZ plane (slice through X)
            const maxSlice = dims[0] - 1;
            const sliceIdx = Math.min(idx, maxSlice);
            this.currentSlice = {
                width: dims[1],
                height: dims[2],
                data: []
            };
            
            for (let z = 0; z < dims[2]; z++) {
                for (let y = 0; y < dims[1]; y++) {
                    const index = sliceIdx + y * dims[0] + z * dims[0] * dims[1];
                    this.currentSlice.data.push(vol[index] || 0);
                }
            }
        }
    }

    render(timestamp) {
        if (this.lastTime) {
            this.fps = Math.round(1000 / (timestamp - this.lastTime));
        }
        this.lastTime = timestamp;
        
        if (this.params.show3D && this.gl && this.gl.createShader) {
            this.render3D();
        } else {
            this.render2DSlice();
        }
    }

    render2DSlice() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        
        if (!this.currentSlice) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const slice = this.currentSlice;
        const scaleX = canvas.width / slice.width;
        const scaleY = canvas.height / slice.height;
        const scale = Math.min(scaleX, scaleY);
        
        const w = slice.width * scale;
        const h = slice.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        
        // Create ImageData
        const imgData = ctx.createImageData(slice.width, slice.height);
        
        // Find min/max for normalization
        let min = Infinity, max = -Infinity;
        slice.data.forEach(v => {
            if (v < min) min = v;
            if (v > max) max = v;
        });
        
        const range = max - min || 1;
        
        // Fill image data
        for (let i = 0; i < slice.data.length; i++) {
            const normalized = (slice.data[i] - min) / range;
            const value = Math.floor(normalized * this.params.brightness * this.params.contrast * 255);
            const clamped = Math.max(0, Math.min(255, value));
            
            imgData.data[i * 4] = clamped;     // R
            imgData.data[i * 4 + 1] = clamped; // G
            imgData.data[i * 4 + 2] = clamped; // B
            imgData.data[i * 4 + 3] = 255;     // A
        }
        
        // Draw scaled slice
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = slice.width;
        tempCanvas.height = slice.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imgData, 0, 0);
        
        ctx.drawImage(tempCanvas, x, y, w, h);
        
        // Draw info overlay
        ctx.fillStyle = '#10b981';
        ctx.font = '14px monospace';
        ctx.fillText(`${this.params.sliceAxis.toUpperCase()} | Slice ${this.params.sliceIndex}`, 10, 20);
        ctx.fillText(`${slice.width}×${slice.height}`, 10, 40);
    }

    render3D() {
        // 3D volume rendering placeholder
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('3D Volume Rendering', canvas.width / 2, canvas.height / 2);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('(Advanced feature - coming soon)', canvas.width / 2, canvas.height / 2 + 25);
    }

    updateParameters(params) {
        const oldAxis = this.params.sliceAxis;
        const oldIndex = this.params.sliceIndex;
        
        this.params = { ...this.params, ...params };
        
        // Recalculate slice if axis or index changed
        if (this.params.sliceAxis !== oldAxis || this.params.sliceIndex !== oldIndex) {
            this.prepareSliceData();
        }
    }

    getDefaultParameters() {
        const dims = this.dimensions;
        const maxSlices = {
            axial: dims[2] - 1,
            coronal: dims[1] - 1,
            sagittal: dims[0] - 1
        };
        
        return {
            sliceAxis: { 
                value: 'axial', 
                type: 'select', 
                options: ['axial', 'coronal', 'sagittal'],
                label: 'Slice Axis' 
            },
            sliceIndex: { 
                value: Math.floor(maxSlices[this.params.sliceAxis] / 2), 
                min: 0, 
                max: maxSlices[this.params.sliceAxis], 
                step: 1, 
                label: 'Slice' 
            },
            brightness: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: 'Brightness' },
            contrast: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: 'Contrast' },
            show3D: { value: false, type: 'checkbox', label: '3D Volume' }
        };
    }
}
