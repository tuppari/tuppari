var util = require('util'),
  EventEmitter = require('events').EventEmitter;

/**
 * Create a new channel of specified application.
 *
 * @param {String} The application that contains this channel.
 * @param {String} channelName The channel name to join.
 * @constructor
 */
var Channel = module.exports = function (application, channelName) {
  this.application = application;
  this.channelName = channelName;
};
util.inherits(Channel, EventEmitter);

/**
 * Send message to gyoji server.
 *
 * @param {String} eventName The event name to bind
 * @param {Object} data The data to send
 * @param {Function} [callback] Call when message send succeeded or failed.
 */
Channel.prototype.send = function (eventName, data, callback) {
  this.emit('log', 'send', eventName, data);
  this.application.publish(this.channelName, eventName, data, callback);
};