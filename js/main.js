/**
 * 🚀 Main Application Entry Point
 * 
 * Coordinates all modules and handles user interactions.
 */

import { UniversalDataAdapter } from './core/UniversalDataAdapter.js';
import { VisualizationEngine } from './core/VisualizationEngine.js';
import { StateManager } from './core/StateManager.js';
import { QRGenerator } from './utils/QRGenerator.js';

class ModularDataVisualizer {
    constructor() {
        this.adapter = new UniversalDataAdapter();
        this.stateManager = new StateManager();
        this.qrGenerator = new QRGenerator();
        
        this.canvas = document.getElementById('mainCanvas');
        this.vizEngine = new VisualizationEngine(this.canvas);
        
        this.currentData = null;
        this.initUI();
        this.checkURLState();
    }

    /**
     * Initialize UI event listeners
     */
    initUI() {
        // File drop zone
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Visualization selector
        const vizSelector = document.getElementById('vizSelector');
        vizSelector.addEventListener('change', (e) => {
            if (this.currentData) {
                this.loadVisualization(e.target.value);
            }
        });

        // QR code generation
        const generateQRBtn = document.getElementById('generateQR');
        generateQRBtn.addEventListener('click', () => this.generateQRCode());

        // Copy link
        const copyLinkBtn = document.getElementById('copyLink');
        copyLinkBtn.addEventListener('click', () => this.copyShareLink());
    }

    /**
     * Handle file uploads
     */
    async handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        console.log(`📂 Processing: ${file.name}`);

        try {
            // Show loading state
            this.showStatus('Loading file...', 'loading');

            // Load and parse file
            this.currentData = await this.adapter.loadFile(file);
            
            // Update data info panel
            this.updateDataInfo(this.currentData.metadata);

            // Auto-select visualization type
            const suggestedViz = this.adapter.suggestVisualization();
            document.getElementById('vizSelector').value = suggestedViz;

            // Load visualization
            await this.loadVisualization(suggestedViz);

            this.showStatus(`✅ Loaded: ${file.name}`, 'success');

        } catch (error) {
            console.error('Error loading file:', error);
            this.showStatus(`❌ Error: ${error.message}`, 'error');
        }
    }

    /**
     * Load and display visualization
     */
    async loadVisualization(vizType) {
        if (!this.currentData) {
            console.warn('No data loaded');
            return;
        }

        try {
            console.log(`🎨 Loading ${vizType} visualization...`);

            // Load visualization
            const params = await this.vizEngine.loadVisualization(vizType, this.currentData);

            // Update parameter controls
            this.updateParameterControls(params);

            // Update state
            this.stateManager.setState(vizType, params, this.currentData.metadata);
            await this.stateManager.setDataHash(this.currentData);

            // Start stats update
            this.startStatsUpdate();

        } catch (error) {
            console.error('Error loading visualization:', error);
            this.showStatus(`❌ Viz Error: ${error.message}`, 'error');
        }
    }

    /**
     * Update data info panel
     */
    updateDataInfo(metadata) {
        const dataInfo = document.getElementById('dataInfo');
        dataInfo.classList.add('active');

        let infoHTML = `
            <strong>📄 ${metadata.filename}</strong><br>
            <small>Type: ${metadata.type}</small><br>
            <small>Size: ${this.formatBytes(metadata.size)}</small><br>
        `;

        // Add type-specific info
        if (metadata.channels) {
            infoHTML += `<small>Channels: ${metadata.channels}</small><br>`;
        }
        if (metadata.sampleRate) {
            infoHTML += `<small>Sample Rate: ${metadata.sampleRate} Hz</small><br>`;
        }
        if (metadata.duration) {
            infoHTML += `<small>Duration: ${metadata.duration.toFixed(2)}s</small><br>`;
        }
        if (metadata.dimensions) {
            infoHTML += `<small>Dimensions: ${metadata.dimensions.join('×')}</small><br>`;
        }

        dataInfo.innerHTML = infoHTML;
    }

    /**
     * Update parameter controls dynamically based on data type
     */
    updateParameterControls(params) {
        const container = document.getElementById('parameterControls');
        container.innerHTML = '';

        // Determine control layout based on data type
        const dataType = this.currentData?.metadata.type;
        this.applyDynamicUILayout(dataType);

        Object.entries(params).forEach(([key, config]) => {
            const group = document.createElement('div');
            group.className = 'param-group';

            const label = document.createElement('label');
            
            // Handle different control types
            if (config.type === 'checkbox') {
                // Checkbox control
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = key;
                input.checked = config.value;
                
                input.addEventListener('change', (e) => {
                    this.vizEngine.updateParameters({ [key]: e.target.checked });
                    this.updateState(key, e.target.checked);
                });
                
                label.appendChild(input);
                label.appendChild(document.createTextNode(' ' + config.label));
                group.appendChild(label);
                
            } else if (config.type === 'select') {
                // Dropdown select control
                label.textContent = config.label + ': ';
                const select = document.createElement('select');
                select.id = key;
                
                config.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
                    if (opt === config.value) option.selected = true;
                    select.appendChild(option);
                });
                
                select.addEventListener('change', (e) => {
                    this.vizEngine.updateParameters({ [key]: e.target.value });
                    this.updateState(key, e.target.value);
                });
                
                group.appendChild(label);
                group.appendChild(select);
                
            } else {
                // Range slider control
                label.innerHTML = `${config.label} <span class="param-value" id="${key}-value">${config.value}</span>`;

                const input = document.createElement('input');
                input.type = 'range';
                input.id = key;
                input.min = config.min;
                input.max = config.max;
                input.step = config.step;
                input.value = config.value;

                input.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    document.getElementById(`${key}-value`).textContent = value.toFixed(2);
                    this.vizEngine.updateParameters({ [key]: value });
                    this.updateState(key, value);
                });

                group.appendChild(label);
                group.appendChild(input);
            }
            
            container.appendChild(group);
        });
    }

    /**
     * Apply dynamic UI layout based on data type
     */
    applyDynamicUILayout(dataType) {
        const controlPanel = document.querySelector('.control-panel');
        
        // Remove existing layout classes
        controlPanel.classList.remove('audio-layout', 'layout-3d', 'timeseries-layout', 'brain-layout');
        
        // Apply data-type specific layout
        if (dataType === 'audio') {
            controlPanel.classList.add('audio-layout');
            this.showAudioControls();
        } else if (dataType === 'mesh3d' || dataType === 'pointcloud') {
            controlPanel.classList.add('layout-3d');
            this.show3DControls();
        } else if (dataType === 'nifti') {
            controlPanel.classList.add('brain-layout');
            this.showBrainControls();
        } else if (dataType === 'timeseries' || dataType === 'eeg') {
            controlPanel.classList.add('timeseries-layout');
            this.showTimeseriesControls();
        }
    }

    /**
     * Show audio-specific controls
     */
    showAudioControls() {
        // Add audio transport controls (play/pause, timeline scrubber)
        const container = document.getElementById('parameterControls');
        const audioControls = document.createElement('div');
        audioControls.className = 'audio-transport';
        audioControls.innerHTML = `
            <div class="transport-buttons">
                <button id="playPause" class="btn-icon">▶️</button>
                <button id="stop" class="btn-icon">⏹️</button>
            </div>
            <div class="timeline">
                <input type="range" id="audioTimeline" min="0" max="100" value="0" class="timeline-slider">
                <span id="timeDisplay">0:00 / 0:00</span>
            </div>
        `;
        container.insertBefore(audioControls, container.firstChild);
    }

    /**
     * Show 3D navigation controls
     */
    show3DControls() {
        const container = document.getElementById('parameterControls');
        const nav3D = document.createElement('div');
        nav3D.className = 'nav-3d';
        nav3D.innerHTML = `
            <div class="nav-hint">
                <strong>🖱️ 3D Mouse Controls</strong><br>
                <small>
                    🖱️ <strong>Drag</strong> to rotate<br>
                    🔍 <strong>Scroll</strong> to zoom<br>
                    📱 <strong>Pinch</strong> to zoom (touch)
                </small>
            </div>
        `;
        container.insertBefore(nav3D, container.firstChild);
    }

    /**
     * Show brain-specific controls
     */
    showBrainControls() {
        const container = document.getElementById('parameterControls');
        const brainNav = document.createElement('div');
        brainNav.className = 'brain-navigation';
        brainNav.innerHTML = `
            <div class="nav-hint">
                <strong>🧠 Brain Volume Navigation</strong><br>
                <small>Use slice controls to navigate through volume</small>
            </div>
        `;
        container.insertBefore(brainNav, container.firstChild);
    }

    /**
     * Show timeseries controls
     */
    showTimeseriesControls() {
        const container = document.getElementById('parameterControls');
        const timeControls = document.createElement('div');
        timeControls.className = 'timeseries-controls';
        timeControls.innerHTML = `
            <div class="nav-hint">
                <strong>📊 Time Series</strong><br>
                <small>Adjust visualization parameters below</small>
            </div>
        `;
        container.insertBefore(timeControls, container.firstChild);
    }

    /**
     * Helper to update state
     */
    updateState(key, value) {
        const currentParams = this.stateManager.getState().parameters;
        if (currentParams[key]) {
            currentParams[key].value = value;
            this.stateManager.setState(
                this.stateManager.getState().vizType,
                currentParams,
                this.stateManager.getState().metadata
            );
        }
    }

    /**
     * Start stats display update
     */
    startStatsUpdate() {
        const statsDiv = document.getElementById('stats');
        
        const updateStats = () => {
            const fps = this.vizEngine.getFPS();
            const state = this.stateManager.getState();
            
            statsDiv.innerHTML = `
                FPS: ${fps}<br>
                Type: ${state.vizType || 'none'}<br>
                Data: ${this.currentData?.metadata.type || 'none'}
            `;
            
            requestAnimationFrame(updateStats);
        };
        
        updateStats();
    }

    /**
     * Generate QR code for current state
     */
    async generateQRCode() {
        const url = this.stateManager.generateShareableURL();
        const container = document.getElementById('qrContainer');
        
        container.classList.add('active');
        await this.qrGenerator.generate(url, container);
        
        console.log('🔗 Shareable URL:', url);
    }

    /**
     * Copy share link to clipboard
     */
    async copyShareLink() {
        const url = this.stateManager.generateShareableURL();
        
        try {
            await navigator.clipboard.writeText(url);
            this.showStatus('✅ Link copied to clipboard!', 'success');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            
            // Fallback: show URL in alert
            prompt('Copy this link:', url);
        }
    }

    /**
     * Check if URL contains state parameter
     */
    checkURLState() {
        const state = this.stateManager.loadFromURL();
        
        if (state) {
            console.log('📥 Loading state from URL:', state);
            this.showStatus('⚡ Restored from shared link', 'info');
            
            // Note: Would need the actual data file to fully restore
            // This shows the concept - in production, you might store
            // small datasets in the URL or use cloud storage
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Could add a toast notification system here
        const dataInfo = document.getElementById('dataInfo');
        if (dataInfo) {
            const statusDiv = document.createElement('div');
            statusDiv.style.cssText = `
                padding: 0.5rem;
                margin-top: 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
            `;
            statusDiv.textContent = message;
            
            dataInfo.appendChild(statusDiv);
            
            setTimeout(() => statusDiv.remove(), 3000);
        }
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new ModularDataVisualizer();
    });
} else {
    window.app = new ModularDataVisualizer();
}

console.log('🌊 Modular Data Visualizer loaded');
