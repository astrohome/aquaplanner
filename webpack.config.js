var path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
require('style-loader');
require('css-loader');

const rules = {
  fonts: {
    test: /\.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
    loader: 'file-loader?name=fonts/[name].[ext]'
  }
}

module.exports = {
  entry: './src/aquarium.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
      new ExtractTextPlugin("styles.css"),
    /*  new OptimizeCssAssetsPlugin({
        cssProcessor: require('cssnano'),
        cssProcessorOptions: { discardComments: {removeAll: true } },
        canPrint: true
      }), */
      new webpack.ProvidePlugin({
          $: "jquery",
          jQuery: "jquery",
          jquery: 'jquery'
      })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      },
      rules.fonts
    ]
  }
}
