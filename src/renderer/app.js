class VST3AudioProcessor {
    constructor() {
        this.audioInitialized = false;
        this.currentPlugin = null;
        this.plugins = [];
        
        this.initializeEventListeners();
        this.checkElectronAPI();
    }
    
    checkElectronAPI() {
        if (window.electronAPI) {
            this.log('Electron API available');
        } else {
            this.error('Electron API not available');
        }
    }
    
    initializeEventListeners() {
        document.getElementById('initAudio').addEventListener('click', () => {
            this.initializeAudio();
        });
        
        document.getElementById('testAudio').addEventListener('click', () => {
            this.testAudioProcessing();
        });
    }
    
    async initializeAudio() {
        try {
            this.updateStatus('Initializing audio engine...', 'info');
            
            const result = await window.electronAPI.initializeAudio();
            
            if (result.success) {
                this.audioInitialized = true;
                this.updateStatus('Audio engine initialized successfully!', 'success');
                document.getElementById('testAudio').disabled = false;
                document.getElementById('initAudio').disabled = false;
                
                this.updateWorkspace(`
                    <h2>Audio Engine Ready</h2>
                    <p>Audio engine has been initialized successfully.</p>
                    <p>You can now load VST3 plugins and start processing audio.</p>
                `);
            } else {
                throw new Error(result.message || 'Failed to initialize audio engine');
            }
        } catch (error) {
            this.updateStatus(`Error initializing audio: ${error.message}`, 'error');
            this.error('Audio initialization failed:', error);
        }
    }
    
    async testAudioProcessing() {
        try {
            this.updateStatus('Testing audio processing...', 'info');
            
            const sampleRate = 44100;
            const duration = 1;
            const frequency = 440;
            const samples = sampleRate * duration;
            const audioData = new Float32Array(samples);
            
            for (let i = 0; i < samples; i++) {
                audioData[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
            }
            
            const result = await window.electronAPI.processAudio(audioData);
            
            if (result.success) {
                this.updateStatus('Audio processing test completed!', 'success');
                this.updateWorkspace(`
                    <h2>Audio Processing Test</h2>
                    <p>Successfully processed ${samples} audio samples.</p>
                    <p>Input: ${frequency}Hz sine wave</p>
                    <p>Output: ${result.processedData ? 'Processed data received' : 'No output data'}</p>
                `);
            } else {
                throw new Error('Audio processing failed');
            }
        } catch (error) {
            this.updateStatus(`Audio processing test failed: ${error.message}`, 'error');
            this.error('Audio processing test failed:', error);
        }
    }
    
    updateWorkspace(content) {
        document.getElementById('workspaceContent').innerHTML = content;
    }
    
    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        this.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    log(...args) {
        if (window.electronAPI) {
            window.electronAPI.log(...args);
        } else {
            console.log(...args);
        }
    }
    
    error(...args) {
        if (window.electronAPI) {
            window.electronAPI.error(...args);
        } else {
            console.error(...args);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new VST3AudioProcessor();
});