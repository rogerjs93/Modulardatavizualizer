/**
 * 📤 DataSharing Service
 * 
 * Handles sharing of large data files via GitHub Gists.
 * Enables QR code sharing for 3D models and other large datasets.
 */

export class DataSharing {
    constructor() {
        this.gistCache = new Map();
    }

    /**
     * Upload data to GitHub Gist and get shareable URL
     * @param {Object} data - The data object to share
     * @param {File} originalFile - The original file object
     * @param {Object} vizState - Current visualization state
     * @returns {Promise<string>} - Short shareable URL
     */
    async uploadToGist(data, originalFile, vizState) {
        try {
            console.log('📤 Uploading to GitHub Gist...');

            // Create file content
            const fileContent = this.serializeDataFile(data, originalFile);
            
            // Create Gist payload
            const gistData = {
                description: `Modular Data Visualizer - ${originalFile.name}`,
                public: true,
                files: {
                    [originalFile.name]: {
                        content: fileContent
                    },
                    'viz-state.json': {
                        content: JSON.stringify(vizState, null, 2)
                    },
                    'README.md': {
                        content: this.generateReadme(originalFile, vizState)
                    }
                }
            };

            // Upload to GitHub Gist (anonymous)
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(gistData)
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const gist = await response.json();
            
            // Generate short URL
            const gistId = gist.id;
            const shareURL = `${window.location.origin}${window.location.pathname}?gist=${gistId}`;
            
            // Cache the gist
            this.gistCache.set(gistId, {
                url: shareURL,
                gist: gist,
                timestamp: Date.now()
            });

            console.log('✅ Gist created:', gist.html_url);
            console.log('🔗 Share URL:', shareURL);

            return shareURL;

        } catch (error) {
            console.error('❌ Error uploading to Gist:', error);
            
            // Fallback: use localStorage for small files
            if (this.canUseLocalStorage(data)) {
                return this.uploadToLocalStorage(data, originalFile, vizState);
            }
            
            throw new Error('File too large for sharing. Please use the export/import feature instead.');
        }
    }

    /**
     * Serialize data file for upload
     */
    serializeDataFile(data, originalFile) {
        // For binary files, convert to base64
        if (data.metadata.type === 'mesh3d' || data.metadata.type === 'pointcloud') {
            // Store as JSON with base64 encoded data if needed
            return JSON.stringify({
                type: data.metadata.type,
                format: data.data.format,
                data: data.data,
                metadata: data.metadata
            }, null, 2);
        }
        
        // For text-based files, return as-is
        return JSON.stringify(data, null, 2);
    }

    /**
     * Generate README for Gist
     */
    generateReadme(file, vizState) {
        return `# 📊 ${file.name}

**Shared from Modular Data Visualizer**

## File Information
- **Filename**: ${file.name}
- **Type**: ${vizState.metadata.type}
- **Size**: ${this.formatBytes(file.size)}
- **Shared**: ${new Date().toLocaleString()}

## Visualization State
- **Visualization Type**: ${vizState.vizType}
- **Parameters**: ${JSON.stringify(vizState.parameters, null, 2)}

## How to View
1. Open the [Modular Data Visualizer](${window.location.origin}${window.location.pathname})
2. Use this link: [View Visualization](${window.location.origin}${window.location.pathname}?gist=GIST_ID)
3. Or scan the QR code

## About
This file was shared using the Modular Data Visualizer - a browser-based tool for universal data visualization.
`;
    }

    /**
     * Load data from GitHub Gist
     * @param {string} gistId - The Gist ID from URL
     * @returns {Promise<Object>} - Loaded data and state
     */
    async loadFromGist(gistId) {
        try {
            console.log('📥 Loading from GitHub Gist:', gistId);

            // Check cache first
            if (this.gistCache.has(gistId)) {
                console.log('✅ Using cached Gist data');
                const cached = this.gistCache.get(gistId);
                return await this.parseGistData(cached.gist);
            }

            // Fetch from GitHub
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const gist = await response.json();
            
            // Cache it
            this.gistCache.set(gistId, {
                gist: gist,
                timestamp: Date.now()
            });

            console.log('✅ Gist loaded:', gist.html_url);

            return await this.parseGistData(gist);

        } catch (error) {
            console.error('❌ Error loading from Gist:', error);
            throw error;
        }
    }

    /**
     * Parse Gist data into usable format
     */
    async parseGistData(gist) {
        const files = gist.files;
        
        // Find the data file (skip README and viz-state)
        const dataFile = Object.keys(files).find(name => 
            name !== 'README.md' && name !== 'viz-state.json'
        );
        
        if (!dataFile) {
            throw new Error('No data file found in Gist');
        }

        // Parse data content
        const dataContent = files[dataFile].content;
        const data = JSON.parse(dataContent);

        // Parse viz state
        let vizState = null;
        if (files['viz-state.json']) {
            vizState = JSON.parse(files['viz-state.json'].content);
        }

        return {
            data: data,
            vizState: vizState,
            filename: dataFile,
            gistUrl: gist.html_url
        };
    }

    /**
     * Fallback: use localStorage for small files
     */
    uploadToLocalStorage(data, originalFile, vizState) {
        const shareId = this.generateShareId();
        
        const shareData = {
            data: data,
            vizState: vizState,
            filename: originalFile.name,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem(`share_${shareId}`, JSON.stringify(shareData));
            
            const shareURL = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
            console.log('📦 Using localStorage fallback:', shareURL);
            
            return shareURL;
        } catch (error) {
            throw new Error('File too large for sharing');
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage(shareId) {
        const key = `share_${shareId}`;
        const dataStr = localStorage.getItem(key);
        
        if (!dataStr) {
            throw new Error('Share link expired or not found');
        }

        return JSON.parse(dataStr);
    }

    /**
     * Check if file can fit in localStorage
     */
    canUseLocalStorage(data) {
        try {
            const size = new Blob([JSON.stringify(data)]).size;
            return size < 5 * 1024 * 1024; // 5MB limit
        } catch {
            return false;
        }
    }

    /**
     * Generate random share ID
     */
    generateShareId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Format bytes for display
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Export data as downloadable file
     */
    exportAsFile(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `export-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Create a data URL for immediate sharing (very small files only)
     */
    createDataURL(data) {
        const json = JSON.stringify(data);
        const base64 = btoa(encodeURIComponent(json));
        return `${window.location.origin}${window.location.pathname}?data=${base64}`;
    }
}
