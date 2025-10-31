# 📊 System Diagrams & Visual Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    🌊 MODULAR DATA VISUALIZER                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              │
                              ▼
                    
        ┌──────────────────────────────────────┐
        │  1. USER DROPS FILE                  │
        │     (Audio, EEG, MRI, CSV, etc.)    │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  2. UNIVERSAL DATA ADAPTER           │
        │     • Auto-detect format             │
        │     • Parse file structure           │
        │     • Extract metadata               │
        │     • Standardize data               │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  3. VISUALIZATION ENGINE             │
        │     • Choose best viz type           │
        │     • Initialize WebGL               │
        │     • Create parameter controls      │
        │     • Start render loop              │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  4. REAL-TIME RENDERING              │
        │     • GPU-accelerated @ 60 FPS       │
        │     • Interactive parameters         │
        │     • Smooth animations              │
        └──────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────┐
        │  5. STATE MANAGEMENT                 │
        │     • Serialize current state        │
        │     • Generate shareable URL         │
        │     • Create QR code                 │
        └──────────────────────────────────────┘
```

---

## Data Flow Architecture

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐
│   USER   │──────▶│  FILE INPUT  │──────▶│ DATA ADAPTER │
└──────────┘       └──────────────┘       └──────────────┘
                                                   │
                                                   │ Standardized
                                                   │ Data Format
                                                   ▼
                                          ┌──────────────┐
                                          │     DATA     │
                                          │   STORE      │
                                          └──────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────┐
                    │                              │               │
                    ▼                              ▼               ▼
          ┌──────────────┐              ┌──────────────┐  ┌──────────────┐
          │     VIZ      │              │    STATE     │  │   METADATA   │
          │   ENGINE     │              │   MANAGER    │  │   DISPLAY    │
          └──────────────┘              └──────────────┘  └──────────────┘
                    │                              │
                    │                              │
                    ▼                              ▼
          ┌──────────────┐              ┌──────────────┐
          │    CANVAS    │              │  QR + SHARE  │
          │  RENDERING   │              │    LINKS     │
          └──────────────┘              └──────────────┘
```

---

## Universal Data Adapter - The Brain

```
┌─────────────────────────────────────────────────────────┐
│           UNIVERSAL DATA ADAPTER                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  INPUT: Any File                                        │
│     ├── Drag & Drop                                     │
│     └── File Browser                                    │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │  DETECTION LAYER                           │        │
│  │  • Check file extension                    │        │
│  │  • Verify MIME type                        │        │
│  │  • Peek at file structure                  │        │
│  │  • Pattern matching                        │        │
│  └────────────────────────────────────────────┘        │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐        │
│  │  PARSER SELECTION                          │        │
│  │  Audio    → AudioParser                    │        │
│  │  EEG/EDF  → EDFParser                      │        │
│  │  CSV      → CSVParser                      │        │
│  │  JSON     → JSONParser                     │        │
│  │  NIfTI    → NIfTIParser                    │        │
│  │  Image    → ImageParser                    │        │
│  │  Other    → GenericParser                  │        │
│  └────────────────────────────────────────────┘        │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────┐        │
│  │  STANDARDIZATION                           │        │
│  │  All formats → Common structure:           │        │
│  │  {                                         │        │
│  │    type: string,                           │        │
│  │    data: { channels, metadata },           │        │
│  │    metadata: {...}                         │        │
│  │  }                                         │        │
│  └────────────────────────────────────────────┘        │
│                     │                                    │
│                     ▼                                    │
│  OUTPUT: Standardized Data + Suggested Viz             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Visualization Engine Pipeline

```
┌─────────────────────────────────────────────────────────┐
│               VISUALIZATION ENGINE                       │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ WebGL 2 │     │ WebGL 1 │     │Canvas 2D│
    │  (GPU)  │     │  (GPU)  │     │  (CPU)  │
    └─────────┘     └─────────┘     └─────────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │ Visualization Module │
              │ Selection            │
              └─────────────────────┘
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │Waveform  │    │TimeSeries│    │  3D Vol  │
    │   Viz    │    │   Viz    │    │   Viz    │
    └──────────┘    └──────────┘    └──────────┘
          │               │                │
          └───────────────┼────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │  Render Loop        │
              │  @ 60 FPS           │
              └─────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │  SCREEN OUTPUT      │
              └─────────────────────┘
```

---

## File Format Support Matrix

```
┌────────────┬──────────┬──────────┬──────────────┬──────────┐
│  FORMAT    │ DETECT   │  PARSE   │   RENDER     │  SHARE   │
├────────────┼──────────┼──────────┼──────────────┼──────────┤
│ WAV        │    ✅    │    ✅    │  Waveform    │    ✅    │
│ MP3        │    ✅    │    ✅    │  Waveform    │    ✅    │
│ OGG        │    ✅    │    ✅    │  Waveform    │    ✅    │
│ EDF        │    ✅    │    ✅    │  TimeSeries  │    ✅    │
│ CSV (EEG)  │    ✅    │    ✅    │  TimeSeries  │    ✅    │
│ JSON       │    ✅    │    ✅    │  TimeSeries  │    ✅    │
│ NIfTI      │    ✅    │    🔶    │  (future)    │    ✅    │
│ DICOM      │    ✅    │    🔶    │  (future)    │    ✅    │
│ PNG/JPG    │    ✅    │    ✅    │  Heatmap     │    ✅    │
└────────────┴──────────┴──────────┴──────────────┴──────────┘

Legend: ✅ Full Support | 🔶 Partial | ❌ Not Yet
```

---

## State Sharing Workflow

```
┌─────────────────────────────────────────────────────────┐
│  STEP 1: USER CONFIGURES VISUALIZATION                  │
│  • Loads data                                           │
│  • Adjusts parameters                                   │
│  • Chooses viz type                                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: STATE MANAGER SERIALIZES                       │
│  Current State = {                                      │
│    vizType: "waveform",                                 │
│    parameters: { amplitude: 2.5, ... },                 │
│    metadata: { filename, type, ... },                   │
│    dataHash: "sha256...",                               │
│    timestamp: "2025-10-31..."                           │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 3: COMPRESS & ENCODE                              │
│  JSON → Base64 → URL Parameter                         │
│  Size: ~500 bytes (compact!)                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 4: GENERATE SHAREABLE URL                         │
│  https://example.com/?state=eyJ2aXp...                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 5: CREATE QR CODE                                 │
│  ┌─────────────┐                                        │
│  │ ▓▓▓ ▓ ▓ ▓▓▓ │                                        │
│  │ ▓ ▓ ▓▓▓ ▓ ▓ │  Scan to restore!                     │
│  │ ▓ ▓ ▓ ▓ ▓ ▓ │                                        │
│  └─────────────┘                                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 6: RECIPIENT SCANS/CLICKS                         │
│  • URL loaded in browser                                │
│  • State parameter detected                             │
│  • State decoded & restored                             │
│  • Visualization recreated!                             │
│  (Note: Recipient needs same data file)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Flow

```
┌──────────────┐
│ LARGE FILE   │  10 million samples
│  UPLOADED    │  
└──────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  ADAPTIVE DOWNSAMPLING                   │
│  Screen width: 1920 pixels               │
│  Need to show: ~2000 samples max         │
│  Downsample ratio: 5000:1                │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  GPU UPLOAD                              │
│  Transfer to GPU memory                  │
│  Create vertex buffers                   │
│  Compile shaders                         │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│  PARALLEL RENDERING                      │
│  GPU processes all vertices              │
│  simultaneously                          │
│  Result: 60 FPS!                         │
└──────────────────────────────────────────┘
```

---

## User Journey Map

```
FIRST-TIME USER EXPERIENCE:

1. Arrival
   │
   ├─▶ Opens index.html
   │   └─▶ Sees clean, intuitive UI
   │       └─▶ "Wow, looks professional!"
   │
2. Discovery
   │
   ├─▶ Sees drop zone
   │   └─▶ Drags sample_eeg.csv
   │       └─▶ "Oh, I just drag files here?"
   │
3. Delight
   │
   ├─▶ Data loads instantly
   │   └─▶ Visualization appears automatically
   │       └─▶ "It just works!"
   │
4. Engagement
   │
   ├─▶ Moves amplitude slider
   │   └─▶ Waveform scales in real-time
   │       └─▶ "Whoa, so responsive!"
   │
5. Sharing
   │
   ├─▶ Clicks "Generate QR"
   │   └─▶ QR code appears
   │       └─▶ "I can share this?!"
   │
6. Advocacy
   │
   └─▶ Shows colleagues
       └─▶ "You have to try this!"
```

---

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 5: USER INTERFACE                                │
│  • HTML5 semantic markup                                │
│  • CSS3 Grid/Flexbox layout                             │
│  • Responsive design                                     │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: APPLICATION LOGIC                             │
│  • ES6+ JavaScript modules                              │
│  • Event-driven architecture                            │
│  • State management                                     │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: CORE MODULES                                  │
│  • UniversalDataAdapter                                 │
│  • VisualizationEngine                                  │
│  • StateManager                                         │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: BROWSER APIs                                  │
│  • File API                                             │
│  • Web Audio API                                        │
│  • WebGL 2.0                                            │
│  • Canvas 2D                                            │
│  • Clipboard API                                        │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: HARDWARE                                      │
│  • GPU (Graphics Processing)                            │
│  • CPU (JavaScript execution)                           │
│  • Memory (Data storage)                                │
└─────────────────────────────────────────────────────────┘
```

---

## Module Interaction Diagram

```
                    ┌──────────────┐
                    │   main.js    │
                    │ (Coordinator)│
                    └──────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Data      │  │     Viz      │  │    State     │
│   Adapter    │  │   Engine     │  │   Manager    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        │                  │                  │
        ▼                  ▼                  ▼
    Parsers          Viz Modules         QR Generator
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                    Browser APIs
```

---

## Future Architecture (Phase 6+)

```
Current (v1.0):
┌──────────────────────────────────────┐
│  Monolithic Application              │
│  • All features bundled              │
│  • Fixed visualizations              │
│  • Core parsers only                 │
└──────────────────────────────────────┘

Future (v2.0):
┌──────────────────────────────────────┐
│  Core System (lightweight)           │
├──────────────────────────────────────┤
│  Plugin Layer                        │
│  ├─ Viz Plugin A                     │
│  ├─ Viz Plugin B                     │
│  ├─ Parser Plugin C                  │
│  └─ Analysis Plugin D                │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Plugin Marketplace                  │
│  • Discover                          │
│  • Install                           │
│  • Update                            │
│  • Review                            │
└──────────────────────────────────────┘
```

---

**These diagrams show the elegant simplicity of the system:**
- Clean separation of concerns
- Modular architecture
- Easy to understand
- Easy to extend

**The beauty is in the universal adapter - everything else just works! ✨**
