{
  "targets": [
    {
      "target_name": "audio_engine",
      "sources": [
        "src/native/audio_engine.cc"
      ],
      "cflags_cc": [
        "-std=c++17"
      ],
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS": [
          "-std=c++17"
        ],
        "MACOSX_DEPLOYMENT_TARGET": "10.9"
      },
      "conditions": [
        [
          "OS=='win'",
          {
            "sources": [
              "src/native/audio_engine_win.cc"
            ]
          }
        ],
        [
          "OS=='linux'",
          {
            "sources": [
              "src/native/audio_engine_linux.cc"
            ]
          }
        ],
        [
          "OS=='mac'",
          {
            "sources": [
              "src/native/audio_engine_mac.cc"
            ]
          }
        ]
      ]
    }
  ]
}
