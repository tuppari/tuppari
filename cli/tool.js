var fs = require('fs'),
    path = require('path'),
    qs = require('querystring'),
    request = require('request'),
    crypto = require('crypto'),
    util = require('util');

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
 * Make signed URL
 *
 * @param {String} method HTTP method (GET|POST)
 * @param {String} path Relative path to request
 * @param {Object} obj POST body. if method is not 'POST', this parameter is ignored.
 * @return {String} Signed URL
 */
exports.signedUrl = function (program) {
  return function (method, path, obj) {
    var params = {
      public_key: program.credentials.id,
      auth_timestamp: parseInt(new Date().getTime() / 1000),
      auth_version: '1.0'
    };

    if (method === 'POST') {
      params.body_hash = crypto.createHash('md5').update(JSON.stringify(obj), 'utf8').digest('hex');
    }

    var queryString = qs.stringify(params);
    var signData = [ method, path, queryString ].join('\n');
    var signature = crypto.createHmac('sha256', program.credentials.secret).update(signData).digest('hex');

    return util.format('%s?%s&auth_signature=%s', path, queryString, signature);
  };
};

/**
 * POST request
 */
exports.post = function(program) {
  return function(path, body, callback) {
    var uri = program.endpoint(path);
    program.debug('POST %s', uri);

    request.post({
      uri: uri,
      json: body
    }, function (err, res, body) {
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
 * Make GET request
 */
exports.get = function (program) {
  return function(path, callback) {
    var uri = program.endpoint(path);
    program.debug('GET %s', uri);

    request({
      uri: uri
    }, function (err, res, body) {
      program.abortIfError(err, res, body);
      program.debug('response:\n%s', program.prettyFormat(body));
      if (callback) {
        callback(res, body);
      }
      process.exit(0);
    });
  };
};
