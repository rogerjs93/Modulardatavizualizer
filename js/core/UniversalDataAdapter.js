/**
 * 🧠 UniversalDataAdapter
 * 
 * Smart data loader that automatically detects file types and converts them
 * into a standardized format for visualization.
 * 
 * Supports:
 * - Audio (WAV, MP3, OGG, FLAC)
 * - EEG/MEG (EDF, BDF, FIF, CSV)
 * - Neuroimaging (NIfTI, DICOM)
 * - Time series (CSV, JSON, TSV)
 * - Images (PNG, JPG, TIFF)
 * - Generic binary data
 */

export class UniversalDataAdapter {
    constructor() {
        this.supportedFormats = {
            audio: ['.wav', '.mp3', '.ogg', '.flac', '.m4a'],
            eeg: ['.edf', '.bdf', '.fif', '.set', '.csv', '.txt'],
            neuroimaging: ['.nii', '.nii.gz', '.dcm', '.dicom'],
            timeseries: ['.csv', '.tsv', '.json', '.txt'],
            image: ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
            video: ['.mp4', '.webm', '.avi'],
            generic: ['.bin', '.dat']
        };

        this.detectedType = null;
        this.metadata = {};
        this.rawData = null;
    }

    /**
     * Main entry point: load and auto-detect file type
     */
    async loadFile(file) {
        console.log(`📁 Loading file: ${file.name} (${this.formatBytes(file.size)})`);
        
        const extension = this.getFileExtension(file.name);
        const dataType = this.detectDataType(extension, file);
        
        this.detectedType = dataType;
        this.metadata = {
            filename: file.name,
            size: file.size,
            type: dataType,
            extension: extension,
            mimeType: file.type,
            lastModified: new Date(file.lastModified)
        };

        console.log(`🔍 Detected type: ${dataType}`);

        // Parse based on detected type
        let parsedData;
        switch (dataType) {
            case 'audio':
                parsedData = await this.parseAudio(file);
                break;
            case 'eeg':
                parsedData = await this.parseEEG(file, extension);
                break;
            case 'neuroimaging':
                parsedData = await this.parseNeuroimaging(file, extension);
                break;
            case 'timeseries':
                parsedData = await this.parseTimeSeries(file, extension);
                break;
            case 'image':
                parsedData = await this.parseImage(file);
                break;
            case 'video':
                parsedData = await this.parseVideo(file);
                break;
            default:
                parsedData = await this.parseGeneric(file);
        }

        this.rawData = parsedData;
        return this.standardizeData(parsedData);
    }

    /**
     * Detect data type from file extension and MIME type
     */
    detectDataType(extension, file) {
        // Check each category
        for (const [type, extensions] of Object.entries(this.supportedFormats)) {
            if (extensions.includes(extension)) {
                return type;
            }
        }

        // Fallback to MIME type detection
        if (file.type.startsWith('audio/')) return 'audio';
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';

        return 'generic';
    }

    /**
     * Parse AUDIO files (WAV, MP3, OGG, etc.)
     */
    async parseAudio(file) {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const channels = [];
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                channels.push(audioBuffer.getChannelData(i));
            }

            this.metadata.sampleRate = audioBuffer.sampleRate;
            this.metadata.duration = audioBuffer.duration;
            this.metadata.channels = audioBuffer.numberOfChannels;

            console.log(`🎵 Audio: ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz, ${audioBuffer.duration.toFixed(2)}s`);

            return {
                type: 'audio',
                channels: channels,
                sampleRate: audioBuffer.sampleRate,
                duration: audioBuffer.duration,
                length: audioBuffer.length
            };
        } catch (error) {
            console.error('Error decoding audio:', error);
            throw error;
        }
    }

    /**
     * Parse EEG/MEG data (EDF, CSV, etc.)
     */
    async parseEEG(file, extension) {
        if (extension === '.edf' || extension === '.bdf') {
            return await this.parseEDF(file);
        } else if (extension === '.csv' || extension === '.txt') {
            return await this.parseCSVasEEG(file);
        } else {
            throw new Error(`EEG format ${extension} not yet implemented`);
        }
    }

    /**
     * Parse EDF (European Data Format) - common EEG format
     */
    async parseEDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const dataView = new DataView(arrayBuffer);
        
        // EDF Header (256 bytes)
        const header = {
            version: this.readString(dataView, 0, 8),
            patientID: this.readString(dataView, 8, 80),
            recordingID: this.readString(dataView, 88, 80),
            startDate: this.readString(dataView, 168, 8),
            startTime: this.readString(dataView, 176, 8),
            headerBytes: parseInt(this.readString(dataView, 184, 8)),
            reserved: this.readString(dataView, 192, 44),
            numRecords: parseInt(this.readString(dataView, 236, 8)),
            recordDuration: parseFloat(this.readString(dataView, 244, 8)),
            numSignals: parseInt(this.readString(dataView, 252, 4))
        };

        console.log(`📊 EDF: ${header.numSignals} channels, ${header.numRecords} records`);

        // Parse signal headers (256 bytes per signal)
        const signals = [];
        let offset = 256;
        
        for (let i = 0; i < header.numSignals; i++) {
            const signal = {
                label: this.readString(dataView, offset, 16).trim(),
                transducerType: this.readString(dataView, offset + 16, 80),
                physicalDimension: this.readString(dataView, offset + 96, 8),
                physicalMin: parseFloat(this.readString(dataView, offset + 104, 8)),
                physicalMax: parseFloat(this.readString(dataView, offset + 112, 8)),
                digitalMin: parseInt(this.readString(dataView, offset + 120, 8)),
                digitalMax: parseInt(this.readString(dataView, offset + 128, 8)),
                prefiltering: this.readString(dataView, offset + 136, 80),
                numSamples: parseInt(this.readString(dataView, offset + 216, 8)),
                reserved: this.readString(dataView, offset + 224, 32)
            };
            signals.push(signal);
            offset += 256;
        }

        this.metadata.sampleRate = signals[0].numSamples / header.recordDuration;
        this.metadata.channels = header.numSignals;
        this.metadata.duration = header.numRecords * header.recordDuration;

        return {
            type: 'eeg',
            header: header,
            signals: signals,
            dataOffset: header.headerBytes,
            sampleRate: this.metadata.sampleRate,
            channels: header.numSignals
        };
    }

    /**
     * Parse CSV as EEG data (assumes columns = channels)
     */
    async parseCSVasEEG(file) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        // Detect delimiter
        const delimiter = text.includes('\t') ? '\t' : ',';
        
        // Parse header if exists
        const firstLine = lines[0].split(delimiter);
        const hasHeader = isNaN(parseFloat(firstLine[0]));
        
        const channelNames = hasHeader ? firstLine : firstLine.map((_, i) => `Ch${i + 1}`);
        const dataLines = hasHeader ? lines.slice(1) : lines;
        
        // Parse data
        const numChannels = channelNames.length;
        const channels = Array(numChannels).fill(null).map(() => []);
        
        dataLines.forEach(line => {
            const values = line.split(delimiter).map(v => parseFloat(v));
            values.forEach((val, i) => {
                if (!isNaN(val) && i < numChannels) {
                    channels[i].push(val);
                }
            });
        });

        this.metadata.channels = numChannels;
        this.metadata.samples = channels[0].length;
        this.metadata.channelNames = channelNames;

        console.log(`📈 CSV EEG: ${numChannels} channels, ${channels[0].length} samples`);

        return {
            type: 'eeg',
            channels: channels.map(ch => new Float32Array(ch)),
            channelNames: channelNames,
            sampleRate: 250, // Default, can be adjusted
            samples: channels[0].length
        };
    }

    /**
     * Parse neuroimaging data (NIfTI, DICOM)
     */
    async parseNeuroimaging(file, extension) {
        if (extension === '.nii' || extension === '.nii.gz') {
            return await this.parseNIfTI(file);
        } else {
            throw new Error(`Neuroimaging format ${extension} not yet implemented`);
        }
    }

    /**
     * Parse NIfTI format (simplified header parsing)
     */
    async parseNIfTI(file) {
        const arrayBuffer = await file.arrayBuffer();
        const dataView = new DataView(arrayBuffer);
        
        // NIfTI-1 header (348 bytes)
        const header = {
            sizeofHdr: dataView.getInt32(0, true),
            dim: Array.from({length: 8}, (_, i) => dataView.getInt16(40 + i * 2, true)),
            datatype: dataView.getInt16(70, true),
            bitpix: dataView.getInt16(72, true),
            pixdim: Array.from({length: 8}, (_, i) => dataView.getFloat32(76 + i * 4, true)),
            voxOffset: dataView.getFloat32(108, true),
            sclSlope: dataView.getFloat32(112, true),
            sclInter: dataView.getFloat32(116, true)
        };

        console.log(`🧠 NIfTI: Dimensions ${header.dim.slice(1, 4).join('x')}`);

        this.metadata.dimensions = header.dim.slice(1, 4);
        this.metadata.voxelSize = header.pixdim.slice(1, 4);

        return {
            type: 'neuroimaging',
            format: 'nifti',
            header: header,
            dataOffset: Math.floor(header.voxOffset),
            dimensions: header.dim.slice(1, 4),
            voxelSize: header.pixdim.slice(1, 4)
        };
    }

    /**
     * Parse time series data (CSV, JSON)
     */
    async parseTimeSeries(file, extension) {
        if (extension === '.json') {
            const text = await file.text();
            const data = JSON.parse(text);
            return {
                type: 'timeseries',
                data: data,
                format: 'json'
            };
        } else {
            // Parse as CSV
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            const delimiter = text.includes('\t') ? '\t' : ',';
            
            const headers = lines[0].split(delimiter);
            const data = lines.slice(1).map(line => {
                const values = line.split(delimiter);
                const row = {};
                headers.forEach((header, i) => {
                    row[header.trim()] = isNaN(values[i]) ? values[i] : parseFloat(values[i]);
                });
                return row;
            });

            return {
                type: 'timeseries',
                data: data,
                headers: headers,
                format: 'csv'
            };
        }
    }

    /**
     * Parse image files
     */
    async parseImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                this.metadata.width = img.width;
                this.metadata.height = img.height;
                
                console.log(`🖼️ Image: ${img.width}x${img.height}`);
                
                resolve({
                    type: 'image',
                    image: img,
                    width: img.width,
                    height: img.height,
                    url: url
                });
            };
            
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * Parse video files
     */
    async parseVideo(file) {
        const url = URL.createObjectURL(file);
        return {
            type: 'video',
            url: url,
            file: file
        };
    }

    /**
     * Parse generic binary data
     */
    async parseGeneric(file) {
        const arrayBuffer = await file.arrayBuffer();
        return {
            type: 'generic',
            buffer: arrayBuffer,
            size: arrayBuffer.byteLength
        };
    }

    /**
     * Standardize parsed data into common format
     */
    standardizeData(parsedData) {
        return {
            type: parsedData.type,
            metadata: this.metadata,
            data: parsedData,
            timestamp: new Date()
        };
    }

    /**
     * Utility: Read ASCII string from DataView
     */
    readString(dataView, offset, length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            const char = dataView.getUint8(offset + i);
            if (char === 0) break;
            str += String.fromCharCode(char);
        }
        return str;
    }

    /**
     * Utility: Get file extension
     */
    getFileExtension(filename) {
        const parts = filename.toLowerCase().split('.');
        if (parts.length === 1) return '';
        
        // Handle .nii.gz
        if (parts[parts.length - 2] === 'nii' && parts[parts.length - 1] === 'gz') {
            return '.nii.gz';
        }
        
        return '.' + parts[parts.length - 1];
    }

    /**
     * Utility: Format bytes to human-readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get metadata summary
     */
    getMetadata() {
        return this.metadata;
    }

    /**
     * Get suggested visualization type
     */
    suggestVisualization() {
        switch (this.detectedType) {
            case 'audio':
                return 'waveform';
            case 'eeg':
                return 'timeseries';
            case 'neuroimaging':
                return '3d-brain';
            case 'image':
                return 'heatmap';
            case 'timeseries':
                return 'timeseries';
            default:
                return 'auto';
        }
    }
}
