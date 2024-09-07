const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/serverlessDeploy/http/lambda.ts',
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'lambda.js',
    path: path.resolve(__dirname, '.webpack'),
    libraryTarget: 'commonjs',
  },
};
