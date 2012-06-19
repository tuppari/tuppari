var Tuppari = require('../');

describe('tuppari', function () {

  describe('.version', function () {
    it('should return library version number', function () {
      Tuppari.version.should.eql('0.1.0');
    })
  })

  describe('channel.send()', function () {
    it('should send message to gyoji', function (done) {
      var tuppari = new Tuppari({
        host: 'http://localhost:5100',
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

      channel.send('your_event', { message: 'hello world' }, function (err, res, body) {
        if (err) return done(err);
        console.log(body);
        done();
      });
    })
  });

})