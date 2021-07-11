const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const config = require('./webpack.config.js');
const compiler = webpack(config);

const kdcProxy = createProxyMiddleware({
  target: 'http://localhost:5000',
  pathRewrite: {
    '^/kdc/': '/',
  }
});
app.use('/kdc', kdcProxy);
// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
);

// Serve the files on port 8000.
app.listen(8000, function () {
  console.log('Example app listening on port 8000!\n');
});
