const path = require('path');
const fs = require('fs');

class CopyPreloadPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyPreloadPlugin', (compilation) => {
      const src = path.resolve(__dirname, 'src/main/preload.js');
      const dest = path.resolve(__dirname, 'dist/main/preload.js');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    });
  }
}

module.exports = {
  entry: './src/main/index.js',
  target: 'electron-main',
  mode: process.env.NODE_ENV || 'development',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'index.js',
  },
  externals: {
    fsevents: false,
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, 'node_modules')],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    electron: '27.0.0',
                  },
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      },
    ],
  },
  plugins: [new CopyPreloadPlugin()],
};
