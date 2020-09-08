const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');


const base = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'cheap-module-source-map',
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.js', '.ts', '.tsx', '.json']
  },
  module: {
    rules: [
      // ts-loader
      {
        test: /\.(ts|tsx)?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      // css-loader
      {
        test: /\.css$/,
        loader: 'css-loader',
        exclude: /node_modules/
      }

    ],
  },
  optimization: {
    minimize: true
  },
  externals: {
    "react": "React"
  }
};


const tempConfig = process.env.NODE_ENV === 'production' ? {
    ...base,
    entry: './index.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'laputarednerer',
        libraryTarget: 'umd'
    },
    devtool: 'none',
    externals: {
        'react': 'react',
        'react-dom': 'react-dom'
    },
    plugins: [
        new CleanWebpackPlugin()  // clear output dict before compiling
    ]
} : {
    ...base,
    entry: path.join(__dirname, 'example/demo.tsx'),
    output: {
        path: path.join(__dirname, 'example/dist'),
        filename: 'bundle.js',
        library: 'laputarenderer',
        libraryTarget: 'umd'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, './example/index.html'),
            filename: 'index.html'
        })
    ],
    devServer: {
      port: 3000
    }
};

module.exports = tempConfig;
