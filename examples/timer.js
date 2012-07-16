var Tuppari = require('../');

console.log(process.argv);

var args = process.argv.slice(2);

var tuppari = new Tuppari({
  host: 'https://api.tuppari.com', // You can change this to your own host
  applicationId: 'your_application_id',
  accessKeyId: 'your_access_key_id',
  accessSecretKey: 'your_access_secret_key'
});

tuppari.on('log', function (eventType) {
  var args = Array.prototype.slice.call(arguments, 1);
  console.log(eventType, args);
});

var channel = tuppari.join('your_channel');
channel.on('log', function (eventType) {
  var args = Array.prototype.slice.call(arguments, 1);
  console.log(eventType, args);
});

setInterval(function () {
  channel.send('your_event', Date.now(), function (err, res, body) {
    if (err) {
      console.error(err);
    }
    console.log(res.statusCode, body);
  });
}, 1000);
