var Tuppari = require('../');

console.log(process.argv);

var args = process.argv.slice(2);

var tuppari = new Tuppari({
  host: 'http://localhost:5100',
  applicationId: "d7c47280-c9cd-11e1-bab6-67a886786455",
  accessKeyId: "d7cb0230-c9cd-11e1-bab6-67a886786455",
  accessSecretKey: "d7cb0231-c9cd-11e1-bab6-67a886786455"
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

channel.send('your_event', args[0], function (err, res, body) {
  if (err) {
    console.error(err);
  }
  console.log(res.statusCode, body);
});
