var
  package = require('../package'),
  Channel = require('./channel'),
  request = require('request'),
  crypto = require('crypto'),
  qs = require('querystring'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter;

/**
 * Create a client for tuppari application specified by applicationId.
 *
 * @param options
 * @param options.applicationId The application id to connect
 * @param options.accessKeyId The access key id for the application
 * @param options.accessSecretKey The access secret key for the application
 * @constructor
 */
var Tuppari = module.exports = function (options) {
  // TODO: validate options parameter.

  this.host = options.host || 'http://api.tuppari.com';
  this.applicationId = options.applicationId;
  this.accessKeyId = options.accessKeyId;
  this.accessSecretKey = options.accessSecretKey;
};
util.inherits(Tuppari, EventEmitter);

/**
 * Library version.
 */
Tuppari.version = package.version;

/**
 * Create new channel and join it.
 *
 * @param {String} channelName The channel name to join.
 * @return {Channel}
 */
Tuppari.prototype.join = function (channelName) {
  return new Channel(this, channelName);
};

/**
 * Publish specified event message to specified channel of the application.
 *
 * @param {String} channelName
 * @param {String} eventName
 * @param {Object} data
 * @param {Function} [callback]
 */
Tuppari.prototype.publish = function (channelName, eventName, data, callback) {
  var body = {
    channelName: channelName,
    eventName: eventName,
    data: data
  };

  var path = '/publish/' + this.applicationId;
  this._post(path, body, callback);
};

/**
 * POST request.
 *
 * @private
 */
Tuppari.prototype._post = function (path, body, callback) {
  var options = {
    method: 'POST',
    path: path,
    body: body
  };

  var signedPath = this._sign(options);

  this.emit('log', 'POST', this.host, signedPath, body);

  request.post({
    uri: this.host + signedPath,
    json: body
  }, callback);
};

/**
 * GET request.
 *
 * @private
 */
Tuppari.prototype._get = function (path, callback) {
  var options = {
    method: 'GET',
    path: path
  };

  var signedPath = this._sign(options);
  request.get({
    uri: this.host + signedPath
  }, callback);
};

/*
 * Utilities
 */

/**
 * Returns signed URL.
 *
 * @param {String} method HTTP method (GET|POST)
 * @param {String} path Relative path to request
 * @param {Object} obj POST body. if method is not 'POST', this parameter is ignored.
 * @return {String} Signed URL
 * @private
 */
Tuppari.prototype._sign = function (options) {
  var method = options.method;
  var path = options.path;
  var body = options.body;

  var params = {
    public_key: this.accessKeyId,
    auth_timestamp: parseInt(new Date().getTime() / 1000),
    auth_version: '1.0'
  };

  if (method === 'POST') {
    params.body_hash = crypto.createHash('md5').update(JSON.stringify(body), 'utf8').digest('hex');
  }

  var queryString = qs.stringify(params);
  var signData = [ method, path, queryString ].join('\n');
  var signature = crypto.createHmac('sha256', this.accessSecretKey).update(signData).digest('hex');

  return util.format('%s?%s&auth_signature=%s', path, queryString, signature);
};