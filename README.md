# Voicemod VST3 Audio Processor

A cross-platform Electron application for VST3 audio processing, similar to Voicemod. This application provides real-time audio effects processing with VST3 plugin support.

## Project Structure

```
.
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.js      # Main application entry point
│   │   └── preload.js    # Context bridge for secure IPC
│   ├── renderer/          # Electron renderer process (UI)
│   │   ├── index.html    # HTML template
│   │   └── renderer.js   # Renderer JavaScript
│   ├── audio/             # Audio engine module
│   │   └── engine.js     # Audio processing engine
│   ├── vst/               # VST3 plugin management
│   │   └── loader.js     # VST3 plugin loader
│   └── native/            # Native module source code
│       ├── audio_engine.cc
│       ├── audio_engine_win.cc
│       ├── audio_engine_mac.cc
│       └── audio_engine_linux.cc
├── public/                # Static assets
├── dist/                  # Build output (generated)
│   ├── main/
│   └── renderer/
├── webpack.main.config.js    # Webpack config for main process
├── webpack.renderer.config.js # Webpack config for renderer
├── binding.gyp            # Node-gyp configuration for native modules
└── package.json          # Project dependencies and scripts
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Python 3.x (for native module compilation)
- C++ compiler (MSVC for Windows, Clang for macOS, GCC for Linux)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build native modules (optional, for full functionality):
```bash
npm run build:native
```

## Development

### Running in Development Mode

```bash
npm start
```

This will:
- Start webpack dev server for renderer on http://localhost:8080
- Compile the main process
- Launch the Electron app with DevTools enabled

### Individual Commands

- Build main process: `npm run build:main`
- Build renderer: `npm run build:renderer`
- Watch main process: `npm run dev:main`
- Dev server for renderer: `npm run dev:renderer`
- Start Electron: `npm run electron`

## Building

### Build for Distribution

```bash
npm run dist
```

This creates platform-specific installers in the `release/` directory.

### Build Options

- `npm run dist` - Build full installers
- `npm run dist:dev` - Build portable version without installer

## Features

### IPC Communication

The application uses Electron IPC for secure main-renderer communication:

#### Audio APIs
- `electronAPI.audio.initialize()` - Initialize audio engine
- `electronAPI.audio.process(audioData)` - Process audio data
- `electronAPI.audio.getDevices()` - Get available audio devices

#### VST3 APIs
- `electronAPI.vst.load(vstPath)` - Load a VST3 plugin
- `electronAPI.vst.getPlugins()` - List available plugins

### Security

- Context isolation enabled
- Sandbox enabled
- Node integration disabled
- Preload script for controlled API exposure

## Native Module Development

The project includes support for native modules using node-gyp for:

- WASAPI audio (Windows)
- Core Audio / Audio Units (macOS)
- ALSA (Linux)
- VST3 SDK integration

To compile native modules:

```bash
# Install node-gyp globally (if not already installed)
npm install -g node-gyp

# Configure build
node-gyp configure

# Build
node-gyp build
```

## Configuration

### Environment Variables

- `NODE_ENV=development` - Enable DevTools and dev server
- `NODE_ENV=production` - Production build mode

### Electron Builder Configuration

Edit the `build` section in `package.json` to customize:
- App icon and name
- Build targets (NSIS, portable, DMG, AppImage, etc.)
- Code signing options
- Update server settings

## IPC Channels Reference

### Main Process → Renderer

- `audio:device-changed` - Fired when audio device configuration changes
- `audio:error` - Fired when audio processing error occurs
- `vst:loaded` - Fired when VST plugin successfully loads
- `vst:error` - Fired when VST loading fails

### Renderer → Main Process

All main process handlers are exposed through `electronAPI`:

```javascript
// Audio control
await window.electronAPI.audio.initialize()
await window.electronAPI.audio.process(audioData)
await window.electronAPI.audio.getDevices()

// VST control
await window.electronAPI.vst.load(path)
await window.electronAPI.vst.getPlugins()
```

## Troubleshooting

### Native Module Build Issues

If native modules fail to compile:

1. Ensure you have a C++ compiler installed
2. Check Python 3.x is installed and in PATH
3. Run: `npm install --build-from-source`

### DevTools Not Opening

Set `NODE_ENV=development` before starting:

```bash
NODE_ENV=development npm start
```

## Contributing

When adding new features:

1. Add corresponding IPC handlers in `src/main/index.js`
2. Expose APIs through `src/main/preload.js`
3. Implement UI in `src/renderer/`
4. Update documentation in this README

## License

MIT

## Related Files

Original Lair World Music website files are preserved in the repository root for reference.
