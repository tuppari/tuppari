var Tuppari = require('../');

console.log(process.argv);

var args = process.argv.slice(2);

var tuppari = new Tuppari({
  host: args[0], 
  applicationId: "fd34f220-b89c-11e1-bafa-81bacb04e21a",
  accessKeyId: "778e1721-0c9e-4aa3-9c5a-a7e8c03fa936",
  accessSecretKey: "6f7dc6fb-e052-469a-9b6d-1d19dac8c088"
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

channel.send('your_event', { message: args[1] }, function (err, res, body) {
  if (err) {
    console.error(err);
  }
  console.log(body);
});
