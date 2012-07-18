var Tuppari = require('tuppari'),
    request = require('request'),
    util = require('util'),
    static = require('node-static'),
    async = require('async'),
    keys = require('./keys');

var BASE_URL = 'http://finance.yahoo.com/d/quotes.csv?e=.csv&f=sl1d1t1&s=%s%s=X';
var currencies = [ 'USD', 'EUR', 'AUD' ];

var tuppari = new Tuppari(keys);
var channel = tuppari.join('currency');

var fileServer = new static.Server('./public');
require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    fileServer.serve(request, response);
  });
}).listen(process.env.PORT || 3000);

function currencyUrl(from, to) {
  return util.format(BASE_URL, from, to);
}

function exchange(from, to, callback) {
  var uri =  currencyUrl(from, to);
  request.get(uri, callback);
}

setTimeout(function _get() {
  var to = 'JPY';
  async.map(currencies, function (currency, next) {
    exchange(currency, to, function (err, res, body) {
      if (err) return next(err);
      var result = body.split(',');
      next(null, { from: currency, to: to, rate: parseFloat(result[1]) });
    });
  },
  function (err, results) {
    if (!err) {
      console.log(results);
      channel.send('update', results, function (err, res, body) {
        console.log(body);
      });
    }
    setTimeout(_get, 5000);
  })
}, 0);



