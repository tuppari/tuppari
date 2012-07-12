/*
 * Tuppari JavaScript Library v0.1.0
 *
 * Copyright 2012, Tuppari.com
 * Released under the MIT licence.
 */

(function(exports) {
  /*
   * Event Names
   */

  /**
   * @constant
   */
  var EVENT_SUBSCRIBE = 'subscribe';

  /**
   * @constant
   */
  var EVENT_BIND = 'bind';

    /*
   * EventEmitter taken from Node.js core module.
   */
  function EventEmitter() {
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.
  EventEmitter.defaultMaxListeners = 10;
  EventEmitter.prototype.setMaxListeners = function(n) {
    if (!this._events) this._events = {};
    this._maxListeners = n;
  };

  EventEmitter.prototype.emit = function() {
    var type = arguments[0];
    // If there is no 'error' event listener then throw.
    if (type === 'error') {
      if (!this._events || !this._events.error ||
          (isArray(this._events.error) && !this._events.error.length))
      {
        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    if (!this._events) return false;
    var handler = this._events[type];
    if (!handler) return false;

    if (typeof handler == 'function') {
      switch (arguments.length) {
        // fast cases
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        // slower
        default:
          var l = arguments.length;
          var args = new Array(l - 1);
          for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
          handler.apply(this, args);
      }
      return true;

    } else if (isArray(handler)) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
      return true;

    } else {
      return false;
    }
  };

  EventEmitter.prototype.addListener = function(type, listener) {
    if ('function' !== typeof listener) {
      throw new Error('addListener only takes instances of Function');
    }

    if (!this._events) this._events = {};

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, typeof listener.listener === 'function' ?
              listener.listener : listener);

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    } else if (isArray(this._events[type])) {

      // If we've already got an array, just append.
      this._events[type].push(listener);

    } else {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];

    }

    // Check for listener leak
    if (isArray(this._events[type]) && !this._events[type].warned) {
      var m;
      if (this._maxListeners !== undefined) {
        m = this._maxListeners;
      } else {
        m = EventEmitter.defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
      }
    }

    return this;
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.once = function(type, listener) {
    if ('function' !== typeof listener) {
      throw new Error('.once only takes instances of Function');
    }

    var self = this;
    function g() {
      self.removeListener(type, g);
      listener.apply(this, arguments);
    };

    g.listener = listener;
    self.on(type, g);

    return this;
  };

  EventEmitter.prototype.removeListener = function(type, listener) {
    if ('function' !== typeof listener) {
      throw new Error('removeListener only takes instances of Function');
    }

    // does not use listeners(), so no side effect of creating _events[type]
    if (!this._events || !this._events[type]) return this;

    var list = this._events[type];

    if (isArray(list)) {
      var position = -1;
      for (var i = 0, length = list.length; i < length; i++) {
        if (list[i] === listener ||
            (list[i].listener && list[i].listener === listener))
        {
          position = i;
          break;
        }
      }

      if (position < 0) return this;
      list.splice(position, 1);
    } else if (list === listener ||
               (list.listener && list.listener === listener))
    {
      delete this._events[type];
    }

    return this;
  };

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      this._events = {};
      return this;
    }

    var events = this._events && this._events[type];
    if (!events) return this;

    if (isArray(events)) {
      events.splice(0);
    } else {
      this._events[type] = null;
    }

    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if (!this._events) this._events = {};
    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  /**
   * Thin WebSocket wrapper.
   *
   * @param {String} applicationId Application ID
   * @param {String} url Tuppari endpoint URL that return actual WebSocket URL.
   * @constructor
   */
  function Socket(applicationId, url) {
    var self = this;
    self.applicationId = applicationId;
    self.url = url;
    self.ws = null;
    self.connected = false;
    self.timer = null;
    self.heartbeatIntarvel = 10000;

    self.on('open', function (ws) {
      self.connected = true;
      self.ws = ws;
      self.emit('connect');
    });

    self.on('close', function (event) {
      self.connected = false;
      self.ws = null;
      self.emit('disconnect', event);
    });
  }
  inherits(Socket, EventEmitter);

  /**
   * Connect to broadcast server specified by apiKey.
   */
  Socket.prototype.connect = function () {
    var self = this;
    self.close();

    self.timer = setInterval(function () {
      if (self.ws === null || self.ws.readyState > 1/*OPEN*/) {
        self.connect();
      }
    }, self.heartbeatIntarvel);

    self._connect();
  };

  Socket.prototype._connect = function () {
    var self = this;

    GET(self.url + '/endpoint', function (err, xhr) {
      if (err) return self.emit('error', err);

      var wsUrl = xhr.responseText;
      if (!wsUrl) {
        return self.emit('error', 'WebSocket endpoint URL not found');
      }

      var ws = new WebSocket(wsUrl);

      ws.onopen = function () {
        self.emit('open', ws);
      };

      ws.onclose = function (event) {
        self.emit('close', event);
      };

      ws.onmessage = function (event) {
        try {
          var data = JSON.parse(event.data);
          if (data.room) {
            var keys = data.room.split(':');
            if (keys.length === 3) {
              if (keys[0] === self.applicationId) {
                self.emit('message', keys[1], keys[2], data.message);
              }
            }
          }
        } catch (e) {
          self.emit('error', e);
        }
      };

      ws.onerror = function (event) {
        self.emit('error', event);
      };
    });
  };

  /**
   * Send data to the server.
   *
   * @param {Object} data Data to send
   */
  Socket.prototype.send = function (event, data) {
    var self = this;

    var command = {};
    command.applicationId = self.applicationId;
    command.event = event;
    command.data = data;

    if (self.ws) {
      self.ws.send(command);
    } else {
      setTimeout(function _send() {
        if (self.ws) {
          self.ws.send(JSON.stringify(command));
        } else {
          setTimeout(_send, 200);
        }
      }, 0);
    }
  };

  /**
   * Close socket if connected.
   */
  Socket.prototype.close = function () {
    if (this.ws) {
      this.ws.close();
    }

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.ws = null;
    this.connected = false;
  };

  /**
   * Construct channel.
   *
   * @param {tuppari.Client} Client instance of this channel
   * @param {String} channelName The name of channel.
   * @constructor
   */
  function Channel(client, channelName) {
    this.client = client;
    this.name = channelName;
    this.events = {};
  }

  /**
   * Bind specified event to this channel.
   *
   * @param {String} eventName Event name to bind
   * @param {Function(data)} callback Function called when event ocurred
   */
  Channel.prototype.bind = function (eventName, callback) {
    this.events[eventName] = callback;
    this.client.bind(this.name, eventName);
  };

  /**
   * Fire specified event to this channel.
   *
   * @param {String} eventName Event name to fire
   * @param {Object} message message data
   */
  Channel.prototype.emit = function (eventName, message) {
    var handler = this.events[eventName];
    if (handler) {
      handler(message);
    }
  };

  /**
   * Rebind events when reconnected to server.
   *
   * @private
   */
  Channel.prototype._rebind = function () {
    var self = this,
      ea = self.events,
      k, eventCallback;

    for (k in ea) {
      if (ea.hasOwnProperty(k)) {
        eventCallback = ea[k];
        self.on(k, eventCallback);
      }
    }
  };

  /**
   * Construct tuppari client instance.
   *
   * @param {Object} options Option parameters
   * @param {String} options.applicationId Tuppri application ID
   * @param {String} options.url Tuppari URL
   * @constructor
   */
  function Client(options) {
    var self = this;

    self.applicationId = options.applicationId;
    self.url = options.url || 'http://ws.tuppari.com';
    self.connected = false;
    self.channels = {};
    self.socket = new Socket(self.applicationId, self.url);

    self.socket.on('connect', function () {
      self.emit('log', 'connected');
    });

    self.socket.on('disconnect', function (event) {
      self.emit('log', 'disconnected', event);
    });

    self.socket.on('message', function (channelName, eventName, message) {
      var ch = self.channels[channelName];
      if (ch) {
        ch.emit(eventName, message);
      }
    });

    self.socket.on('error', function (event) {
      self.emit('error', event);
    });

    self.socket.connect();
  }
  inherits(Client, EventEmitter);

  /**
   * Subscribe specified channel.
   *
   * @param {String} channelName Channel name to subscribe
   * @return {Channel} Channel instance
   */
  Client.prototype.subscribe = function (channelName) {
    var self = this;
    var channel = new Channel(self, channelName);
    self.channels[channelName] = channel;
    return channel;
  };

  /**
   * Bind event.
   *
   * @param {String} channelName
   * @param {String} eventName
   */
  Client.prototype.bind = function (channelName, eventName) {
    var self = this;
    var data = {
      channelName: channelName,
      eventName: eventName
    };
    self.socket.send(EVENT_BIND, data);
  };

  /*
   * Helper functions.
   */

  /**
   * Returns object is Array or not.
   */
  var isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };

  /**
   * Inherits prototype from parent to child.
   */
  function inherits(child, parent) {
    function f() {};
    f.prototype = parent.prototype;
    child.prototype = new f;
  };

  /**
   * GET request to specified URL
   */
  function GET(url, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onload = function (event) {
      callback(null, xhr);
    };

    xhr.onerror = function () {
      callback(new Error('Connect failed to ' + url));
    };

    xhr.open('GET', url, true);
    xhr.send();
  }

  /*
   * Export class and method.
   */

  /**
   * Create tuppari client.
   *
   * @param {Object} options Option parameters
   * @param {String} options.applicationId Tuppri application ID
   * @param {String} options.url Tuppari URL
   *
   * @return {Client} Tuppari client instance.
   */
  function createClient(options) {
    return new Client(options);
  }

  exports.tuppari = {
    createClient: createClient,
    Client: Client,
    Channel: Channel
  };

})(this);