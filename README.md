# 🌊 Modular Data Visualizer

A universal browser-based visualization system that runs entirely client-side, supporting any data type from audio to neuroimaging data.

## ✨ Features

- **🧠 Universal Data Adapter**: Automatically detects and processes multiple data formats
  - Audio files (WAV, MP3, OGG)
  - EEG/MEG data (EDF, BDF, FIF)
  - Neuroimaging (NIfTI, DICOM)
  - Time series (CSV, TSV, JSON)
  - Images and videos
  
- **🎨 Multiple Visualization Types**:
  - Waveform & Spectrogram
  - 3D Brain visualization
  - Heatmaps & Time series
  - Network graphs
  - Volumetric rendering

- **⚡ GPU-Accelerated**: Uses WebGL/WebGPU for high-performance rendering

- **🔗 Shareable**: Generate QR codes to share your visualization setup

- **🎛️ Interactive**: Real-time parameter tuning

## 🚀 Quick Start

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge recommended)
2. Drag & drop your data file
3. Choose visualization type (or let it auto-detect)
4. Tune parameters in real-time
5. Share via QR code!

## 📁 Project Structure

```
modulardatavisualizer/
├── index.html              # Main entry point
├── css/
│   └── main.css           # Styling
├── js/
│   ├── core/
│   │   ├── UniversalDataAdapter.js    # Smart data loader
│   │   ├── VisualizationEngine.js     # WebGL/GPU renderer
│   │   └── StateManager.js            # State serialization
│   ├── modules/           # Visualization modules
│   ├── parsers/           # File format parsers
│   └── utils/
│       └── QRGenerator.js # QR code generation
└── examples/              # Sample data files
```

## 🛠️ Technology Stack

- **Frontend**: Pure JavaScript (ES6+)
- **Graphics**: WebGL 2.0 / WebGPU
- **Performance**: WebAssembly (for heavy computation)
- **No dependencies**: Runs 100% client-side

## 📖 Usage Examples

### Audio Visualization
```javascript
// Drop an audio file to see waveform and spectrogram
```

### EEG Analysis
```javascript
// Load EDF file for multi-channel time series
```

### Brain Imaging
```javascript
// NIfTI files render as 3D volumetric views
```

## 🎯 Roadmap

- [x] Core architecture
- [ ] Universal Data Adapter implementation
- [ ] WebGL visualization engine
- [ ] QR code state sharing
- [ ] WebGPU compute shaders
- [ ] WebAssembly signal processing
- [ ] Plugin system for custom visualizations

## 🤝 Contributing

This is a research/educational project. Contributions welcome!

## 📄 License

MIT License - Feel free to use for research and education
