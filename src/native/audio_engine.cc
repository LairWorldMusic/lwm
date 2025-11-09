/**
 * Native Audio Engine Module
 * Cross-platform audio processing using platform-specific audio APIs
 * This file serves as the main entry point for native module compilation
 */

#include <napi.h>

// Platform-specific implementations
#ifdef _WIN32
#include "audio_engine_win.cc"
#elif __APPLE__
#include "audio_engine_mac.cc"
#elif __linux__
#include "audio_engine_linux.cc"
#endif

// Initialize native module
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Export native audio functions
  exports.Set(Napi::String::New(env, "initialize"),
              Napi::Function::New(env, InitializeAudio));
  exports.Set(Napi::String::New(env, "getDevices"),
              Napi::Function::New(env, GetAudioDevices));
  exports.Set(Napi::String::New(env, "processAudio"),
              Napi::Function::New(env, ProcessAudio));

  return exports;
}

NODE_API_MODULE(audio_engine, Init)
