// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  target: 'node',  // <--- add this line
  entry: './src/index.js',  // <--- update if your main file is located elsewhere
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.min.js',  // <--- the minified bundle
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            // You can add more Babel presets/plugins here
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],  // uses terser for minification
  },
};
