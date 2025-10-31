# 🧪 Testing Guide - Quick Start

## 🚀 Get Up and Running in 2 Minutes!

---

## Method 1: Double-Click (Simplest)

### Windows
1. Navigate to the project folder
2. Double-click `index.html`
3. Your default browser opens the app!

### Limitations:
- File API might have restrictions
- Some browsers block local file access
- Use Method 2 for full functionality

---

## Method 2: Local Server (Recommended)

### Option A: Use the Start Script

**Windows:**
```cmd
start.bat
```

**Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

**What it does:**
- Starts Python HTTP server on port 8000
- Opens http://localhost:8000 in your browser
- Displays the app with full functionality

### Option B: Manual Server Start

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js (if installed):**
```bash
npx http-server -p 8000
```

Then open: http://localhost:8000

---

## 📝 Step-by-Step Testing

### Test 1: Basic Interface (30 seconds)

1. ✅ **Open the app**
   - You should see a dark-themed interface
   - Left panel: Controls
   - Right panel: Canvas area
   - Header: "🌊 Modular Data Visualizer"

2. ✅ **Check responsive layout**
   - Resize browser window
   - UI should adapt gracefully

**Expected Result:**  
Clean, professional interface loads instantly.

---

### Test 2: Sample EEG Data (1 minute)

1. **Locate sample file:**
   ```
   examples/sample_eeg.csv
   ```

2. **Load the file:**
   - Drag `sample_eeg.csv` onto the drop zone
   - OR click drop zone and select file

3. **Observe:**
   - "Loading file..." message appears
   - Data info panel shows:
     - ✅ Filename
     - ✅ Type: eeg
     - ✅ Channels: 8
     - ✅ File size
   - Auto-selects "Time Series" visualization
   - 8 colored channels appear on canvas
   - FPS counter shows ~60

4. **Interact:**
   - Move "Channel Spacing" slider
   - Channels spread apart/together in real-time
   - Move "Time Scale" slider
   - Time axis zooms in/out

**Expected Result:**  
Smooth multi-channel visualization with real-time parameter control.

---

### Test 3: Sample Time Series (1 minute)

1. **Load:**
   ```
   examples/sample_timeseries.json
   ```

2. **Check:**
   - Data type: timeseries
   - JSON data parsed correctly
   - Visualization shows multiple colored lines

3. **Switch viz type:**
   - Dropdown: Change to "Heatmap"
   - (Shows fallback message - not implemented yet)
   - Switch back to "Time Series"

**Expected Result:**  
JSON parsing works, data displays correctly.

---

### Test 4: Your Own Audio File (2 minutes)

1. **Find an audio file:**
   - Any .wav, .mp3, .ogg file
   - Recommended: Short file (< 1 min)

2. **Load it:**
   - Drag onto drop zone

3. **Observe:**
   - Type detected as "audio"
   - Shows sample rate, duration, channels
   - Auto-selects "Waveform" visualization
   - Waveform appears (if stereo, shows first channel)

4. **Adjust:**
   - "Amplitude" slider: Makes waveform taller/shorter
   - "Line Width" slider: Thicker/thinner line
   - Changes update at 60 FPS

**Expected Result:**  
Audio waveform renders smoothly with real-time controls.

---

### Test 5: QR Code Sharing (2 minutes)

1. **Load any data file**

2. **Adjust parameters:**
   - Set some custom values
   - Example: Amplitude = 2.5

3. **Generate QR:**
   - Click "Generate QR Code" button
   - QR code appears (uses external API)
   - Shows scannable code

4. **Copy Link:**
   - Click "Copy Link"
   - Check clipboard (paste somewhere)
   - URL should contain encoded state

5. **Test restoration:**
   - Copy the URL
   - Open in new tab
   - Console shows "Loading state from URL"

**Expected Result:**  
QR code generates, link copies, state encodes properly.

---

## 🔍 Validation Checklist

### ✅ Core Functionality
- [ ] App loads without errors
- [ ] Drop zone accepts files
- [ ] CSV files parse correctly
- [ ] JSON files parse correctly
- [ ] Audio files decode (if browser supports)
- [ ] Data info panel updates
- [ ] Visualization renders
- [ ] FPS counter shows ~60
- [ ] Parameters update in real-time

### ✅ UI/UX
- [ ] Responsive layout works
- [ ] Sliders are smooth
- [ ] Dropdowns function
- [ ] Buttons are clickable
- [ ] Colors are readable
- [ ] Scrollbar appears in sidebar (if needed)

### ✅ Browser Compatibility

**Chrome/Edge (Recommended):**
- [ ] WebGL 2.0 detected
- [ ] All features work
- [ ] Best performance

**Firefox:**
- [ ] WebGL works
- [ ] Audio decoding works
- [ ] Good performance

**Safari:**
- [ ] Falls back to WebGL 1.0 (might see warning)
- [ ] Core features work
- [ ] Acceptable performance

### ✅ Console Output (F12)
Check for:
- [ ] No red errors
- [ ] "🌊 Modular Data Visualizer loaded"
- [ ] "✅ WebGL initialized"
- [ ] File info logs when loading

---

## 🐛 Common Issues & Solutions

### Issue: "WebGL not supported"
**Solution:**
- Update your browser
- Update graphics drivers
- Try different browser
- App falls back to 2D Canvas (still works!)

### Issue: File won't load
**Solution:**
- Check file extension is supported
- Try sample files first
- Check browser console for errors
- Ensure file isn't corrupted

### Issue: QR code not showing
**Solution:**
- Check internet connection (uses external API)
- Try "Copy Link" instead
- Check console for errors

### Issue: Poor performance
**Solution:**
- Try smaller file
- Close other browser tabs
- Check if hardware acceleration is enabled
- Update graphics drivers

### Issue: Can't access clipboard
**Solution:**
- Browser might block clipboard API
- Manually copy the URL from prompt dialog

---

## 🎯 Next Steps After Testing

### 1. Try Your Own Data
```
✅ Audio recordings
✅ EEG/MEG data (EDF or CSV)
✅ Any CSV with numeric columns
✅ JSON time series
✅ Images (will load, basic support)
```

### 2. Explore Parameters
```
Each visualization has different controls
Experiment to see what's possible
```

### 3. Share Visualizations
```
Generate QR codes
Share with colleagues
Test state restoration
```

### 4. Read Documentation
```
📖 README.md - Overview
📖 GETTING_STARTED.md - Detailed guide
📖 ARCHITECTURE.md - Technical details
📖 UNIQUE_FEATURES.md - What makes it special
📖 ROADMAP.md - Future plans
```

### 5. Contribute!
```
Found a bug? → Open an issue
Have an idea? → Suggest a feature
Want to code? → Submit a PR
```

---

## 📊 Performance Benchmarks

### Expected Performance
| File Type | Size | Load Time | FPS |
|-----------|------|-----------|-----|
| CSV (EEG) | 1MB | < 1s | 60 |
| Audio | 5MB | < 2s | 60 |
| JSON | 500KB | < 0.5s | 60 |

### System Requirements
- **Minimum:** Any modern browser from 2020+
- **Recommended:** Chrome/Edge on dedicated GPU
- **Optimal:** Desktop with modern GPU

---

## 🎓 Learning Path

### Beginner
1. ✅ Load sample files
2. ✅ Try different visualizations
3. ✅ Adjust parameters
4. ✅ Generate QR codes

### Intermediate
1. ✅ Load your own data
2. ✅ Understand data formats
3. ✅ Optimize file size
4. ✅ Share configurations

### Advanced
1. ✅ Read source code
2. ✅ Modify visualizations
3. ✅ Add new parsers
4. ✅ Contribute features

---

## 📸 Screenshot Checklist

Take screenshots of:
- [ ] Initial interface
- [ ] Sample EEG loaded
- [ ] Parameter adjustments
- [ ] QR code generated
- [ ] Different visualization types

Use these to:
- Share with others
- Report issues
- Create documentation
- Show your work!

---

## ✨ Success Indicators

**You'll know it's working when:**

1. ✅ Files load in < 3 seconds
2. ✅ Visualizations render at 60 FPS
3. ✅ Parameters adjust instantly
4. ✅ QR codes generate successfully
5. ✅ No errors in console
6. ✅ UI is responsive and smooth

**You'll love it when:**

1. 🎯 "Wow, that was easy!"
2. 🚀 "So fast!"
3. 💡 "I can visualize anything!"
4. 🔗 "Sharing is a breeze!"
5. 🌟 "This actually works offline!"

---

## 🆘 Need Help?

1. **Check Documentation:**
   - README.md
   - GETTING_STARTED.md

2. **Browser Console:**
   - Press F12
   - Check for errors
   - Read log messages

3. **Create Issue:**
   - Describe problem
   - Share console errors
   - Include browser version

---

**Happy Testing! 🧪✨**

Remember: This is v1.0.0 - a solid foundation!  
More features coming in future updates! 🚀
