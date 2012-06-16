var tuppari = require('../');

describe('tuppari', function () {

  describe('.version', function () {
    it('should return library version number', function () {
      tuppari.version.should.eql('0.1.0');
    })
  })

})