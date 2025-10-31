/**
 * 🔗 StateManager
 * 
 * Manages application state and enables sharing via URL/QR codes.
 * Serializes current visualization state for reproduction.
 */

export class StateManager {
    constructor() {
        this.currentState = {
            version: '1.0.0',
            vizType: null,
            parameters: {},
            metadata: {},
            dataHash: null,
            timestamp: null
        };
    }

    /**
     * Update current state
     */
    setState(vizType, parameters, metadata = {}) {
        this.currentState = {
            ...this.currentState,
            vizType: vizType,
            parameters: parameters,
            metadata: metadata,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Serialize state to compressed string
     */
    serializeState() {
        const stateString = JSON.stringify(this.currentState);
        return this.compress(stateString);
    }

    /**
     * Deserialize state from string
     */
    deserializeState(serialized) {
        try {
            const stateString = this.decompress(serialized);
            return JSON.parse(stateString);
        } catch (error) {
            console.error('Error deserializing state:', error);
            return null;
        }
    }

    /**
     * Generate shareable URL
     */
    generateShareableURL() {
        const serialized = this.serializeState();
        const baseURL = window.location.origin + window.location.pathname;
        return `${baseURL}?state=${encodeURIComponent(serialized)}`;
    }

    /**
     * Load state from URL
     */
    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const stateParam = urlParams.get('state');
        
        if (stateParam) {
            const state = this.deserializeState(decodeURIComponent(stateParam));
            if (state) {
                this.currentState = state;
                return state;
            }
        }
        
        return null;
    }

    /**
     * Simple compression using base64 encoding
     * For production, use LZ-string or similar library
     */
    compress(str) {
        try {
            // Convert to base64
            return btoa(encodeURIComponent(str));
        } catch (error) {
            console.error('Compression error:', error);
            return str;
        }
    }

    /**
     * Decompress base64 string
     */
    decompress(str) {
        try {
            return decodeURIComponent(atob(str));
        } catch (error) {
            console.error('Decompression error:', error);
            return str;
        }
    }

    /**
     * Get current state
     */
    getState() {
        return this.currentState;
    }

    /**
     * Export state as JSON file
     */
    exportState() {
        const dataStr = JSON.stringify(this.currentState, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `viz-state-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Import state from JSON file
     */
    async importState(file) {
        try {
            const text = await file.text();
            const state = JSON.parse(text);
            this.currentState = state;
            return state;
        } catch (error) {
            console.error('Error importing state:', error);
            return null;
        }
    }

    /**
     * Generate hash for data identification
     */
    async generateDataHash(data) {
        const str = JSON.stringify(data);
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Set data hash
     */
    async setDataHash(data) {
        this.currentState.dataHash = await this.generateDataHash(data);
    }
}
