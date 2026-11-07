// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 alibaba/open-code-review Contributors

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

function htmlPlugin(filename, chunks, title) {
  return new HtmlWebpackPlugin({
    filename,
    chunks,
    templateContent: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
  });
}

module.exports = (_env, argv) => {
  const mode = argv.mode === 'production' ? 'production' : 'development';
  return {
    mode,
    target: 'web',
    entry: {
      webview: './src/webview/index.tsx',
      configPanel: './src/webview/configPanel.tsx',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    resolve: { extensions: ['.ts', '.tsx', '.js'] },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: { loader: 'ts-loader', options: { configFile: 'tsconfig.json', transpileOnly: true } },
        },
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      ],
    },
    plugins: [
      htmlPlugin('index.html', ['webview'], 'kaid'),
      htmlPlugin('configPanel.html', ['configPanel'], 'kaid Configuration'),
    ],
    devtool: mode === 'production' ? false : 'inline-source-map',
    performance: { hints: false },
  };
};
