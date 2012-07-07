var fs = require('fs'),
  path = require('path'),
  qs = require('querystring'),
  request = require('request'),
  crypto = require('crypto'),
  util = require('util'),
  Tuppari = require('../lib/tuppari'),
  sign = require('../lib/sign');

/*
 * path.{exists,existsSync} was moved to fs.{exists,existsSync} at Node.js v0.8
 *
 * @see https://github.com/joyent/node/wiki/API-changes-between-v0.6-and-v0.8
 */

exports.fileExists = (function () {
  if (path.exists) return path.exists;
  else return fs.exists;
})();

exports.fileExistsSync = (function () {
  if (path.existsSync) return path.existsSync;
  else return fs.existsSync;
})();

/**
 * Load config file from file.
 *
 * @param {String} configFile The path of configuration file
 * @return {Object}
 */
exports.loadConfig = function (configFile) {
  if (!exports.fileExistsSync(configFile)) {
    fs.writeFileSync(configFile, '{}');
    fs.lchmodSync(configFile, 0600);
  }

  var content = fs.readFileSync(configFile);
  return JSON.parse(content);
};

/**
 * POST request
 */
exports.post = function(program) {
  return function(options, callback) {
    var uri = program.endpoint(options.path);

    var config =
      options.authRequired ?
        sign.createSignedRequestConfig('POST', uri, options.operation, options.body, program.credentials.secret) :
        { uri: uri, json: options.body };

    program.debug('POST %s', uri, config);

    request.post(config, function (err, res, body) {
      program.abortIfError(err, res, body);
      program.debug('response:\n%s', program.prettyFormat(body));
      if (callback) {
        callback(res, body);
      }
      process.exit(0);
    });
  };
};

/**
 * GET request
 */
exports.get = function (program) {
  return function(options, callback) {
    var uri = program.endpoint(options.path);

    var config =
      options.authRequired ?
        buildSignedRequest('GET', uri, options.body, program.credentials.secret) :
        { uri: uri };

    var config = sign.createSignedRequestConfig('GET', uri, null, program.credentials.secret);
    program.debug('GET %s', uri, config);

    request(config, function (err, res, body) {
      program.abortIfError(err, res, body);
      program.debug('response:\n%s', program.prettyFormat(body));
      if (callback) {
        callback(res, body);
      }
      process.exit(0);
    });
  };
};