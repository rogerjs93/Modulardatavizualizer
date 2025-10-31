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
            // Try URL-based sharing first (most reliable, no auth needed)
            console.log('📤 Preparing shareable link...');
            
            // Create minimal state object
            const shareState = {
                version: '1.0.0',
                vizType: vizState.vizType,
                parameters: vizState.parameters,
                metadata: vizState.metadata,
                timestamp: new Date().toISOString()
            };

            // Serialize and compress
            let stateStr = JSON.stringify(shareState);
            let isCompressed = false;
            
            if (stateStr.length > 1000) {
                try {
                    const compressed = await this.compressString(stateStr);
                    if (compressed.length < stateStr.length * 0.8) {
                        stateStr = compressed;
                        isCompressed = true;
                        console.log(`🗜️ Compressed: ${this.formatBytes(stateStr.length)} (${((1 - compressed.length / stateStr.length) * 100).toFixed(1)}% reduction)`);
                    }
                } catch (compressError) {
                    console.warn('⚠️ Compression failed, using uncompressed:', compressError);
                }
            }

            // Encode for URL
            const encoded = encodeURIComponent(stateStr);
            
            // Check if it fits in URL (browsers typically support ~2000 chars)
            if (encoded.length < 2000) {
                const shareURL = `${window.location.origin}${window.location.pathname}?state=${encoded}${isCompressed ? '&c=1' : ''}`;
                console.log('✅ Share URL created (URL-based)');
                return shareURL;
            }

            // For larger data, use localStorage with a short ID
            console.log('⚠️ Data too large for URL, using localStorage...');
            return this.uploadToLocalStorage(data, originalFile, vizState);

        } catch (error) {
            console.error('❌ Error creating share link:', error);
            
            // Final fallback: use localStorage
            if (this.canUseLocalStorage(data)) {
                return this.uploadToLocalStorage(data, originalFile, vizState);
            }
            
            throw new Error('File too large for sharing. Try a smaller file or use export/import instead.');
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

        // Parse viz state
        let vizState = null;
        let isCompressed = false;
        if (files['viz-state.json']) {
            vizState = JSON.parse(files['viz-state.json'].content);
            isCompressed = vizState._compressed || false;
        }

        // Parse data content (decompress if needed)
        let dataContent = files[dataFile].content;
        
        if (isCompressed || dataFile.endsWith('.gz.b64')) {
            console.log('🗜️ Decompressing data...');
            try {
                dataContent = await this.decompressString(dataContent);
                console.log('✅ Decompressed successfully');
            } catch (error) {
                console.error('❌ Decompression failed:', error);
                throw new Error('Failed to decompress shared data');
            }
        }
        
        const data = JSON.parse(dataContent);

        return {
            data: data,
            vizState: vizState,
            filename: dataFile.replace('.gz.b64', ''),
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
     * Compress string using gzip and encode as base64
     */
    async compressString(str) {
        // Convert string to Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        
        // Create compression stream
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(data);
                controller.close();
            }
        });
        
        // Compress using gzip
        const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
        
        // Read compressed data
        const reader = compressedStream.getReader();
        const chunks = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        // Combine chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const compressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            compressed.set(chunk, offset);
            offset += chunk.length;
        }
        
        // Convert to base64
        let binary = '';
        for (let i = 0; i < compressed.length; i++) {
            binary += String.fromCharCode(compressed[i]);
        }
        return btoa(binary);
    }

    /**
     * Decompress base64-encoded gzipped string
     */
    async decompressString(base64Str) {
        // Decode base64
        const binary = atob(base64Str);
        const compressed = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            compressed[i] = binary.charCodeAt(i);
        }
        
        // Create decompression stream
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(compressed);
                controller.close();
            }
        });
        
        // Decompress using gzip
        const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
        
        // Read decompressed data
        const reader = decompressedStream.getReader();
        const chunks = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        // Combine chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const decompressed = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            decompressed.set(chunk, offset);
            offset += chunk.length;
        }
        
        // Convert back to string
        const decoder = new TextDecoder();
        return decoder.decode(decompressed);
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
