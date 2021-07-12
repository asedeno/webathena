const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const WebpackShellPluginNext = require('webpack-shell-plugin-next');
const path = require('path');
const webpack = require('webpack');


module.exports = (env) => {
  var config = {
    target: 'node',
    mode: 'production',
    entry: {
      test: {
        import: './test/webpack-entry.js',
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        // node-installed things
        $: 'jquery',
        Q: 'q',
        assert: ['chai', 'assert'],

        // things in ./src/contrib
        sjcl: path.resolve(path.join(__dirname, 'src/contrib/sjcl.js')),

        // Our modules
        log: [path.resolve(path.join(__dirname, 'src/js/util.js')), 'log'],
        arrayutils: [path.resolve(path.join(__dirname, 'src/js/arrayutils.js')), 'default'],
        asn1: [path.resolve(path.join(__dirname, 'src/js/asn1.js')), 'default'],
        kcrypto: [path.resolve(path.join(__dirname, 'src/js/kcrypto.js')), 'default'],
        krb: [path.resolve(path.join(__dirname, 'src/js/krb.js')), 'default'],

        // Our test utilities
        arrayToHex: [path.resolve(path.join(__dirname, 'test/lib/test-utils.js')), 'arrayToHex'],
        arraysEqual: [path.resolve(path.join(__dirname, 'test/lib/test-utils.js')), 'arraysEqual'],
      }),
      new WebpackShellPluginNext({
        onAfterDone: {
          scripts: ["npx mocha test/dist/test.js"],
        },
        swallowError: env['WEBPACK_WATCH'],
      }),
    ],
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'test/dist'),
      clean: true,
    },
    resolve: {
      fallback: {
        "crypto": false,
      },
    },
    watchOptions: {
      ignored: [
        // emacs temp/lock files
        '**/*~',
        '**/.#*',
        // vim swap files
        '**/.*.swp',
      ],
    },
  };
  return config;
};
