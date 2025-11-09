# Electron VST3 Audio Processor - Setup Guide

## Project Initialization Complete ✅

The Electron project structure has been successfully initialized with all required components for VST3 audio processing.

## What's Included

### 1. Core Electron Files
- **src/main/index.js** - Main process with Electron window management and IPC handlers
- **src/main/preload.js** - Secure context bridge for safe renderer-to-main communication
- **src/renderer/index.html** - Renderer HTML template
- **src/renderer/renderer.js** - Renderer process JavaScript
- **src/renderer/styles.css** - Shared CSS styles

### 2. IPC Communication
The application includes pre-configured IPC channels for:

**Audio APIs:**
```javascript
await window.electronAPI.audio.initialize()
await window.electronAPI.audio.process(audioData)
await window.electronAPI.audio.getDevices()
```

**VST3 APIs:**
```javascript
await window.electronAPI.vst.load(vstPath)
await window.electronAPI.vst.getPlugins()
```

### 3. Module Structure
- **src/audio/engine.js** - Audio engine placeholder (ready for native implementation)
- **src/vst/loader.js** - VST3 plugin loader placeholder
- **src/native/** - Native C++ module files (Windows, macOS, Linux)

### 4. Build Configuration
- **webpack.main.config.js** - Webpack configuration for main process
- **webpack.renderer.config.js** - Webpack configuration for renderer
- **binding.gyp** - Node-gyp configuration for native module compilation
- **.babelrc** - Babel configuration for ES6+ transpilation

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Build
```bash
npm start
```

This will:
- Build the main and renderer processes
- Start webpack dev server on http://localhost:8080
- Launch Electron with DevTools enabled

### 3. Production Build
```bash
npm run build
```

### 4. Create Distributable
```bash
npm run dist
```

Creates platform-specific installers in `release/` directory.

## Directory Structure Reference

```
project/
├── src/
│   ├── main/
│   │   ├── index.js        # Main process entry
│   │   └── preload.js      # IPC bridge
│   ├── renderer/
│   │   ├── index.html      # UI template
│   │   ├── renderer.js     # Renderer logic
│   │   └── styles.css      # Styles
│   ├── audio/
│   │   └── engine.js       # Audio engine
│   ├── vst/
│   │   └── loader.js       # VST3 loader
│   ├── native/
│   │   ├── audio_engine.cc
│   │   ├── audio_engine_win.cc
│   │   ├── audio_engine_mac.cc
│   │   └── audio_engine_linux.cc
│   └── __tests__/
│       └── ipc.test.js     # IPC tests
├── public/                 # Static assets
├── dist/                   # Build output
├── webpack.*.config.js     # Webpack configs
├── binding.gyp             # Native module config
├── package.json            # Dependencies
└── README.md               # Project docs
```

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start development
npm start

# Build for production
npm run build

# Create installer
npm run dist

# Clean build artifacts
make clean  # or: rm -rf dist build release
```

## IPC Testing

The application is pre-configured with example IPC handlers. Test them through the UI buttons:

1. **Initialize Audio** - Tests `electronAPI.audio.initialize()`
2. **Get Audio Devices** - Tests `electronAPI.audio.getDevices()`
3. **List VST Plugins** - Tests `electronAPI.vst.getPlugins()`

Error messages will appear in a notification area.

## Next Steps

### 1. Implement Audio Engine
Edit `src/audio/engine.js` to:
- Connect to platform-specific audio APIs (WASAPI, Core Audio, ALSA)
- Implement real-time audio streaming
- Add effect processing chain

### 2. Implement VST3 Loader
Edit `src/vst/loader.js` to:
- Scan for VST3 plugins
- Load and initialize plugins
- Manage plugin parameters

### 3. Implement Native Modules
Extend the C++ source files in `src/native/` with:
- Platform-specific audio API calls
- VST3 SDK integration
- Real-time audio buffer processing

### 4. Build Native Modules
```bash
# Configure build
node-gyp configure

# Build native module
node-gyp build

# Load in main process
const nativeModule = require('./build/Release/audio_engine.node');
```

## Security Features

✅ **Context Isolation** - Renderer cannot access Node.js modules directly
✅ **Sandbox** - Renderer runs in isolated sandbox
✅ **Node Integration Disabled** - No direct Node.js access in renderer
✅ **Preload Script** - Only whitelisted APIs exposed to renderer
✅ **IPC Validation** - All IPC handlers validate input

## Platform Support

### Windows
- WASAPI for audio
- NSIS and portable installers

### macOS
- Core Audio and Audio Units
- DMG and ZIP distributables

### Linux
- ALSA and PulseAudio
- AppImage and .deb packages

## Troubleshooting

### Build Issues
- Ensure Node.js v16+ is installed
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Check C++ compiler is installed

### DevTools Not Showing
```bash
NODE_ENV=development npm start
```

### Native Module Build Issues
```bash
npm install --build-from-source
```

## Configuration Files

- **.babelrc** - ES6+ transpilation settings
- **.eslintrc.json** - Code quality rules
- **.gitignore** - Git exclusions
- **.env.example** - Example environment variables
- **Makefile** - Development shortcuts

## Support

For issues or questions about the Electron structure, refer to:
- [Electron Documentation](https://www.electronjs.org/docs)
- [Node-gyp Documentation](https://github.com/nodejs/node-gyp)
- [Webpack Documentation](https://webpack.js.org/configuration/)

---

**Project initialized:** $(date)
**Electron Version:** 27.0.0
**Node.js Requirement:** v16+
**Status:** Ready for development ✅
