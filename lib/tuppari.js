var package = require('../package'),
  Channel = require('./channel'),
  sign = require('./sign'),
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

  this.host = options.host || 'https://api.tuppari.com';
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
  var path = '/messages'

  this._post(path, 'PublishMessage', body, callback);
};

/**
 * POST request.
 *
 * @private
 */
Tuppari.prototype._post = function (path, operation, body, callback) {
  var config = this._createSignedRequestConfig('POST', path, operation, body);
  this.emit('log', 'POST', config);
  request.post(config, callback);
};

/*
 * Utilities
 */

/**
 * Returns signed request configuration.
 *
 * @param {String} method HTTP method (GET|POST|PUT|DELETE)
 * @param {String} path Relative path to request
 * @param {String} operation Operation name
 * @param {Object} body Request body
 * @return {String} Signed request configuration
 * @private
 */
Tuppari.prototype._createSignedRequestConfig = function (method, path, operation, body) {
  var url = this.host + path;
  return sign.createSignedRequestConfig(method, url, operation, body, this.accessSecretKey)
};

/*
 * Exports utilities.
 */

Tuppari.sign = sign;