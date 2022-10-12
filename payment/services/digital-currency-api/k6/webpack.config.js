/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const Dotenv = require('dotenv-webpack')

module.exports = {
  mode: 'development',
  context: path.join(__dirname, 'src'),
  entry: {
    onlyCreateWallet: './onlyCreateWallet.ts',
    getBalanceBlockchain: './getBalanceBlockchain.ts',
    mint: './mint.ts',
    transfer: './transfer.ts',
    transfer2: './transfer2.ts',
    onlyTransfer: './onlyTransfer.ts',
    completeTransfer: './e2e/completeTransfer.ts',
    onlyMint: './onlyMint.ts',
    transferFailsNotEnoughBalance: './e2e/transferFailsNotEnoughBalance.ts',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'babel-loader',
      },
    ],
  },
  target: 'web',
  externals: /^(k6|https?\:\/\/)(\/.*)?/,
  devtool: 'source-map',
  stats: {
    colors: true,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new Dotenv({
      safe: true, // load '.env.example' to verify the '.env' variables are all set.
    }),
  ],
  optimization: {
    concatenateModules: false,
  },
}
