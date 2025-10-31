# 🏗️ Architecture Overview

## System Design: Modular Data Visualizer

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  (HTML5 + CSS3 + Responsive Design)                         │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   Main Application (main.js)                 │
│  - Event coordination                                        │
│  - UI state management                                       │
│  - Module orchestration                                      │
└──┬──────────┬──────────┬──────────┬────────────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐
│ Data │  │ Viz  │  │State │  │  Utils   │
│Adapt.│  │Engine│  │ Mgr  │  │ (QR etc) │
└──────┘  └──────┘  └──────┘  └──────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌─────────────────────────────────────────┐
│        Browser APIs & Hardware           │
│  - File API    - WebGL 2.0              │
│  - Audio API   - WebGPU (future)        │
│  - Canvas 2D   - WebAssembly (future)   │
└─────────────────────────────────────────┘
```

---

## 🧩 Core Modules

### 1. UniversalDataAdapter.js
**Purpose**: Smart data loading and format detection

**Responsibilities**:
- Auto-detect file types from extensions and MIME types
- Parse various formats (audio, EEG, neuroimaging, etc.)
- Normalize data into standardized structures
- Extract metadata
- Suggest appropriate visualizations

**Key Methods**:
```javascript
loadFile(file)           // Main entry point
detectDataType()         // Format detection
parseAudio()            // Audio file parsing
parseEEG()              // EEG/MEG parsing
parseNeuroimaging()     // Brain imaging
standardizeData()       // Normalize output
```

**Supported Formats**:
- Audio: WAV, MP3, OGG, FLAC
- EEG: EDF, BDF, CSV
- Imaging: NIfTI, DICOM (partial)
- Data: CSV, JSON, TSV
- Media: Images, Video

---

### 2. VisualizationEngine.js
**Purpose**: GPU-accelerated rendering system

**Responsibilities**:
- Initialize WebGL context
- Manage visualization modules
- Handle rendering loop
- Control animation
- Update parameters in real-time

**Key Components**:
```javascript
class VisualizationEngine {
  - initWebGL()
  - loadVisualization()
  - updateParameters()
  - startAnimation()
}

// Visualization Modules:
- WaveformViz
- TimeSeriesViz
- SpectrogramViz (future)
- Brain3DViz (future)
- HeatmapViz (future)
```

**Rendering Pipeline**:
```
Data → Vertex Shader → Rasterization → Fragment Shader → Screen
       ↑                                ↑
   Parameters                      Color/Effects
```

---

### 3. StateManager.js
**Purpose**: State persistence and sharing

**Responsibilities**:
- Serialize application state
- Generate shareable URLs
- Compress/decompress state data
- Load state from URLs
- Export/import JSON states

**State Structure**:
```javascript
{
  version: "1.0.0",
  vizType: "waveform",
  parameters: {
    amplitude: 1.0,
    lineWidth: 2.0
  },
  metadata: {
    filename: "sample.wav",
    type: "audio",
    duration: 30.5
  },
  dataHash: "sha256...",
  timestamp: "2025-10-31T..."
}
```

---

### 4. QRGenerator.js
**Purpose**: QR code generation for sharing

**Responsibilities**:
- Generate QR codes from URLs
- Fallback to external API
- Download QR images
- Display in UI

---

## 🎨 Visualization Module System

### Base Visualization Interface
Every visualization module implements:

```javascript
class BaseVisualization {
  constructor(context, data)
  render(timestamp)
  updateParameters(params)
  getDefaultParameters()
  cleanup()
}
```

### Current Implementations

#### WaveformViz
- **Input**: Single-channel audio/signal
- **Rendering**: WebGL line strip
- **Parameters**: amplitude, lineWidth, color
- **FPS Target**: 60

#### TimeSeriesViz
- **Input**: Multi-channel EEG/time series
- **Rendering**: 2D Canvas (multiple traces)
- **Parameters**: channelSpacing, timeScale
- **FPS Target**: 60

---

## 📊 Data Flow

### Upload Flow
```
User Drops File
    ↓
FileReader API reads file
    ↓
UniversalDataAdapter.loadFile()
    ↓
Format detection
    ↓
Specialized parser (audio/EEG/etc.)
    ↓
Standardized data structure
    ↓
Metadata extraction
    ↓
Update UI with info
    ↓
Suggest visualization type
    ↓
Load visualization
```

### Rendering Flow
```
requestAnimationFrame()
    ↓
VisualizationEngine.render(timestamp)
    ↓
Current viz module.render()
    ↓
WebGL draw calls / Canvas operations
    ↓
Update stats (FPS)
    ↓
Loop
```

### Sharing Flow
```
User clicks "Generate QR"
    ↓
StateManager.serializeState()
    ↓
Compress state to base64
    ↓
Generate URL with state parameter
    ↓
QRGenerator.generate(url)
    ↓
Display QR code
    ↓
User shares
    ↓
Recipient scans QR
    ↓
StateManager.loadFromURL()
    ↓
Restore visualization state
```

---

## 🔧 Technology Stack

### Frontend
- **HTML5**: Semantic markup, drag-drop API
- **CSS3**: Grid, Flexbox, custom properties
- **JavaScript ES6+**: Modules, async/await, classes

### Graphics
- **WebGL 2.0**: GPU-accelerated rendering
- **Canvas 2D**: Fallback rendering
- **WebGPU**: (Future) Compute shaders

### Browser APIs
- **File API**: File reading and handling
- **Web Audio API**: Audio decoding and analysis
- **Clipboard API**: Copy share links
- **Crypto API**: Hash generation
- **URL API**: State parameters

### Future Enhancements
- **WebAssembly**: High-performance DSP
- **Web Workers**: Background processing
- **IndexedDB**: Local data caching
- **Service Workers**: Offline capability (PWA)

---

## 🎯 Design Principles

### 1. Zero Dependencies
- No external libraries required
- Faster loading times
- No security vulnerabilities from deps
- Full control over codebase

### 2. Client-Side Only
- No server required
- Works offline (after initial load)
- Privacy-focused (data never leaves browser)
- Easy deployment (static files)

### 3. Modular Architecture
- Loosely coupled components
- Easy to extend with new visualizations
- Pluggable parsers for new formats
- Clear separation of concerns

### 4. Progressive Enhancement
- Works without WebGL (Canvas fallback)
- Graceful degradation
- Mobile-friendly
- Accessibility considerations

### 5. Performance First
- GPU acceleration where possible
- Efficient data structures
- Lazy loading
- Memory management

---

## 🔐 Security Considerations

### Input Validation
- File size limits
- MIME type checking
- Sanitize user inputs
- Safe parsing (no eval())

### Data Privacy
- No data uploaded to servers
- Local processing only
- Optional cloud sharing (user choice)
- Clear privacy policy

### XSS Prevention
- No innerHTML with user data
- CSP headers (when hosted)
- Sanitized URLs
- Safe state serialization

---

## 📈 Scalability

### Current Limitations
- File size: ~100MB (browser memory)
- Channels: ~64 (rendering performance)
- Sample rate: Auto-downsampled to 4K points

### Future Optimizations
- Streaming for large files
- Virtual scrolling
- Level-of-detail rendering
- WebWorker processing
- WebGPU compute

---

## 🧪 Testing Strategy

### Unit Tests (Future)
- Data parsers
- State serialization
- Parameter validation
- Math functions

### Integration Tests
- File upload flow
- Visualization switching
- State sharing
- UI interactions

### Browser Testing
- Chrome (primary)
- Firefox
- Edge
- Safari (limited)

### Performance Tests
- FPS benchmarks
- Memory profiling
- Large file handling
- Concurrent visualizations

---

## 📂 File Structure

```
modulardatavisualizer/
├── index.html                  # Entry point
├── css/
│   └── main.css               # All styles
├── js/
│   ├── main.js                # App coordinator
│   ├── core/
│   │   ├── UniversalDataAdapter.js
│   │   ├── VisualizationEngine.js
│   │   └── StateManager.js
│   ├── modules/               # Future viz modules
│   │   ├── WaveformViz.js
│   │   ├── SpectrogramViz.js
│   │   └── Brain3DViz.js
│   ├── parsers/               # Future specialized parsers
│   │   ├── EDFParser.js
│   │   ├── NIfTIParser.js
│   │   └── DICOMParser.js
│   └── utils/
│       ├── QRGenerator.js
│       ├── Math.js            # Future DSP functions
│       └── Helpers.js
├── examples/                  # Sample data
│   ├── sample_eeg.csv
│   └── sample_timeseries.json
├── docs/                      # Documentation
│   ├── README.md
│   ├── GETTING_STARTED.md
│   ├── ROADMAP.md
│   └── ARCHITECTURE.md
└── package.json
```

---

## 🚀 Deployment

### Static Hosting
- GitHub Pages
- Netlify
- Vercel
- Any web server

### Requirements
- HTTPS (for clipboard API)
- CORS headers (if loading external data)
- Modern browser support

### Build Process (Future)
```bash
npm run build
  ↓
Bundle modules
  ↓
Minify code
  ↓
Optimize assets
  ↓
Generate service worker
  ↓
Deploy to CDN
```

---

## 🎓 Learning Resources

### For Developers
- WebGL fundamentals
- Signal processing basics
- File format specifications
- Browser API documentation

### For Users
- Getting started guide
- Video tutorials
- Example workflows
- FAQ section

---

**Version**: 1.0.0  
**Last Updated**: October 31, 2025  
**Maintainer**: Development Team
