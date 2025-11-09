// Renderer process - communicates with main process via preload context bridge

const errorDiv = document.getElementById('error-message');

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
  setTimeout(() => {
    errorDiv.classList.remove('show');
  }, 5000);
}

function clearError() {
  errorDiv.classList.remove('show');
  errorDiv.textContent = '';
}

async function initializeAudio() {
  try {
    clearError();
    const result = await window.electronAPI.audio.initialize();
    if (result.success) {
      console.log('Audio engine initialized:', result.message);
      alert('Audio engine initialized successfully!');
    } else {
      showError('Failed to initialize audio: ' + result.error);
    }
  } catch (error) {
    showError('Error initializing audio: ' + error.message);
    console.error('Audio initialization error:', error);
  }
}

async function getAudioDevices() {
  try {
    clearError();
    const result = await window.electronAPI.audio.getDevices();
    if (result.success) {
      console.log('Audio devices:', result.devices);
      alert(`Found ${result.devices.length} audio devices`);
    } else {
      showError('Failed to get devices: ' + result.error);
    }
  } catch (error) {
    showError('Error getting devices: ' + error.message);
    console.error('Get devices error:', error);
  }
}

async function listVSTPlugins() {
  try {
    clearError();
    const result = await window.electronAPI.vst.getPlugins();
    if (result.success) {
      console.log('VST plugins:', result.plugins);
      alert(`Found ${result.plugins.length} VST plugins`);
    } else {
      showError('Failed to get plugins: ' + result.error);
    }
  } catch (error) {
    showError('Error getting plugins: ' + error.message);
    console.error('Get plugins error:', error);
  }
}

// Initialize on load
window.addEventListener('load', async () => {
  console.log('Renderer process loaded');
  console.log('Electron API available:', !!window.electronAPI);
});
