/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'development',
  context: path.join(__dirname, 'src'),
  entry: {
    createTenantEndpoint: './endpoint/createTenant.ts',
    updateTenantEndpoint: './endpoint/updateTenant.ts',
    deleteTenantEndpoint: './endpoint/deleteTenant.ts',
    createEntityEndpoint: './endpoint/createEntity.ts',
    updateEntityEndpoint: './endpoint/updateEntity.ts',
    deleteEntityEndpoint: './endpoint/deleteEntity.ts',
    createWalletEndpoint: './endpoint/createWallet.ts',
    updateWalletEndpoint: './endpoint/updateWallet.ts',
    deleteWalletEndpoint: './endpoint/deleteWallet.ts',
    createTenantKafka: './kafka/createTenant.ts',
    updateTenantKafka: './kafka/updateTenant.ts',
    deleteTenantKafka: './kafka/deleteTenant.ts',
    createEntityKafka: './kafka/createEntity.ts',
    updateEntityKafka: './kafka/updateEntity.ts',
    deleteEntityKafka: './kafka/deleteEntity.ts',
    createWalletKafka: './kafka/createWallet.ts',
    updateWalletKafka: './kafka/updateWallet.ts',
    deleteWalletKafka: './kafka/deleteWallet.ts',
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
  plugins: [new CleanWebpackPlugin()],
  optimization: {
    concatenateModules: false,
  },
}
