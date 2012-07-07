var sign = require('../lib/sign');

var should = require('should');
var sinon = require('sinon');

describe('sign', function() {

  describe('createCanonicalUri()', function () {
    it('should returns the canonical URI specified by the argument', function () {
      sign.createCanonicalUri('/abc').should.eql('/abc');
    })
  })

  describe('createCanonicalUri() with empty arguments', function () {
    it('should returns '/'', function () {
      sign.createCanonicalUri().should.eql('/');
      sign.createCanonicalUri(null).should.eql('/');
      sign.createCanonicalUri(undefined).should.eql('/');
      sign.createCanonicalUri('').should.eql('/');
    })
  })

  describe('createCanonicalQueryString()', function () {
    it('should returns URI encoded and sorted query string', function () {
      sign.createCanonicalQueryString('a=v1').should.eql('a=v1');
      sign.createCanonicalQueryString('b=v2&a=v1').should.eql('a=v1&b=v2');
      sign.createCanonicalQueryString('c=v3&b=v2&a=v1').should.eql('a=v1&b=v2&c=v3');
      sign.createCanonicalQueryString('c=v3&b=v2&a=v1&d=漢字').should.eql('a=v1&b=v2&c=v3&d=%E6%BC%A2%E5%AD%97');
    })
  })

  describe('createCanonicalQueryString() with empty query string', function () {
    it('should returns empty string', function () {
      sign.createCanonicalQueryString('').should.eql('');
      sign.createCanonicalQueryString(null).should.eql('');
      sign.createCanonicalQueryString(undefined).should.eql('');
      sign.createCanonicalQueryString().should.eql('');
    })
  })

  describe('createCanonicalHeaders()', function () {
    it('should convert header name to lower case, sort by character code, and returns each element with new line', function () {
      var headers = {
        "Host": "api.tuppari.com",
        "Content-type": "application/json",
        "X-Tuppari-Operation": "CreateApplication"
      };

      sign.createCanonicalHeaders(headers).should.eql('content-type:application/json\nhost:api.tuppari.com\nx-tuppari-operation:CreateApplication');
    })
  })

  describe('createCanonicalHeaders() with empty object', function () {
    it('should returns empty string', function () {
      sign.createCanonicalHeaders().should.eql('');
      sign.createCanonicalHeaders(null).should.eql('');
      sign.createCanonicalHeaders(undefined).should.eql('');
      sign.createCanonicalHeaders({}).should.eql('');
    })
  })

  describe('createSignedHeaders()', function () {
    it('should convert header name to lower case, sort by character code, and returns it joined with semicolon', function () {
      var headers = {
        "Host": "api.tuppari.com",
        "Content-type": "application/json",
        "X-Tuppari-Operation": "CreateApplication"
      };

      sign.createSignedHeaders(headers).should.eql('content-type;host;x-tuppari-operation');
    })
  })

  describe('createSignedHeaders() with empty object', function () {
    it('should returns empty string', function () {
      sign.createSignedHeaders().should.eql('');
      sign.createSignedHeaders(null).should.eql('');
      sign.createSignedHeaders(undefined).should.eql('');
      sign.createSignedHeaders({}).should.eql('');
    })
  })

  describe('createBodyHash()', function () {
    it('should returns sha256 hash of the argument', function () {
      var body = {"applicationName":"example1"};
      sign.createBodyHash(body).should.eql('8f2d5fe4a93000d3546e578d265fc936806f6ef6dc6f7ee87715e1a5c514c168');
    })
  })

  describe('createBodyHash() with empty object', function () {
    it('should returns the hash of the empty string', function () {
      sign.createBodyHash('').should.eql('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      sign.createBodyHash().should.eql('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      sign.createBodyHash(null).should.eql('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      sign.createBodyHash(undefined).should.eql('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    })
  })

  describe('createCanonicalRequest()', function () {
    it("should returns HTTPRequestMethod + '\n' + CanonicalURI + '\n' + CanonicalQueryString + '\n' + CanonicalHeaders + '\n' + SignedHeaders + '\n' + HexEncode(Hash(body))", function () {
      var method = 'POST';
      var uri = '/test';
      var queryString = 'b=v2&a=v1';
      var headers = {
        "Host": "api.tuppari.com",
        "Content-type": "application/json",
        "X-Tuppari-Operation": "CreateApplication"
      };
      var body = {"applicationName":"example1"};

      var result = sign.createCanonicalRequest(method, uri, queryString, headers, body);

      result.should.eql(
        'POST\n' +
        '/test\n' +
        'a=v1&b=v2\n' +
        'content-type:application/json\n' +
        'host:api.tuppari.com\n' +
        'x-tuppari-operation:CreateApplication\n' +
        'content-type;host;x-tuppari-operation\n' +
        '8f2d5fe4a93000d3546e578d265fc936806f6ef6dc6f7ee87715e1a5c514c168'
      );
    })
  })

  describe('createStringToSign()', function () {
    it("should returns 'SHA256\n' + ISODateString(now) + '\n' + HexEncode(Hash(canonicalRequest))", function () {
      var canonicalRequest =
        'POST\n' +
        '/test\n' +
        'a=v1&b=v2\n' +
        'content-type:application/json\n' +
        'host:api.tuppari.com\n' +
        'x-tuppari-operation:CreateApplication\n' +
        'content-type;host;x-tuppari-operation\n' +
        '8f2d5fe4a93000d3546e578d265fc936806f6ef6dc6f7ee87715e1a5c514c168';

      var clock = sinon.useFakeTimers();
      var now = new Date();
      clock.restore();

      var result = sign.createStringToSign(canonicalRequest, now);
      result.should.eql(
        'SHA256\n' +
        '19700101T000000Z\n' +
        '152176000cc08c7d9d0558bc3a50368aa38619a695ad20f50bec1344429cb315'
      );
    })
  })

  describe('createSignature()', function () {
    it('should returns the same signature signed with the same secret key', function() {
      var secretKey = 'secretKey1';
      var stringToSign =
        'SHA256\n' +
        '19700101T000000Z\n' +
        '152176000cc08c7d9d0558bc3a50368aa38619a695ad20f50bec1344429cb315';

      var clock = sinon.useFakeTimers();
      var now = new Date();
      clock.restore();

      var host = 'api.tuppari.com';
      var expectedSignature = '4815ff1681a278e7c852902ea3604f17831a80a78dc0ff82f5142598a034509b';

      // Check with the same secret key, siganature returns same signature
      for (var i = 0; i < 1000; ++i) {
        var result = sign.createSignature(secretKey, stringToSign, now, host);
        result.should.eql(expectedSignature);
      }
    })
  })

  describe('createSignature()', function () {
    it('should returns the different signature signed with the different secret key', function() {
      var secretKey1 = 'secretKey1';
      var secretKey2 = 'secretKey2';

      var stringToSign =
        'SHA256\n' +
        '19700101T000000Z\n' +
        '152176000cc08c7d9d0558bc3a50368aa38619a695ad20f50bec1344429cb315';

      var clock = sinon.useFakeTimers();
      var now = new Date();
      clock.restore();

      var host = 'api.tuppari.com';
      var expectedSignature = '4815ff1681a278e7c852902ea3604f17831a80a78dc0ff82f5142598a034509b';

      var result1 = sign.createSignature(secretKey1, stringToSign, now, host);
      var result2 = sign.createSignature(secretKey2, stringToSign, now, host);

      result1.should.not.eql(result2);
    })
  })

  describe('createSignedRequestConfig()', function () {
    it('should returns authorizationHeader', function () {
      var now = new Date();

      var method = 'POST';
      var uri = 'http://api.tuppari.com/test?a=v1&b=v2';
      var operation = 'CreateApplication';
      var body = JSON.stringify({
        "applicationName": "example1"
      });
      var accessKeyId = 'accessKeyId';
      var accessSecretKey = 'accessSecretKey';

      var clock = sinon.useFakeTimers();
      var config = sign.createSignedRequestConfig(method, uri, operation, body, accessKeyId, accessSecretKey);
      clock.restore();

      config.uri.should.eql(uri);
      config.body.should.eql(JSON.stringify(body));
      config.headers['Host'].should.eql('api.tuppari.com');
      config.headers['Content-Type'].should.eql('application/json');
      config.headers['X-Tuppari-Date'].should.eql('Thu, 01 Jan 1970 00:00:00 GMT');
      config.headers['X-Tuppari-Operation'].should.eql('CreateApplication');
      config.headers['Authorization'].should.eql('HMAC-SHA256 Credential=accessKeyId,SignedHeaders=content-type;host;x-tuppari-date;x-tuppari-operation,Signature=f35767c9fdba4ba5d5bbbf1c622fceed0dbaeb210303bb56b419c6a51bcf1e5d');
    })
  })

  describe('createAuthorizationHeader()', function () {
    it('should returns algorithm name and calculated authorization values', function () {
      var clock = sinon.useFakeTimers();
      var now = new Date();
      clock.restore();

      var method = 'POST';
      var hostname = 'api.tuppari.com';
      var path = '/test';
      var query = 'a=v1&b=v2';
      var headers = {
        "Host": "api.tuppari.com",
        "Content-type": "application/json",
        "X-Tuppari-Operation": "CreateApplication"
      };
      var body = JSON.stringify({
        "applicationName": "example1"
      });
      var accessKeyId = 'accessKeyId';
      var accessSecretKey = 'accessSecretKey';

      var authorization = sign.createAuthorizationHeader(method, hostname, path, query, headers, body, now, accessKeyId, accessSecretKey);
      authorization.should.eql('HMAC-SHA256 Credential=accessKeyId,SignedHeaders=content-type;host;x-tuppari-operation,Signature=050f8711271747d4f63a3caa3ffb420e4cd5a0e9d9dda8ba7e4faad6794c40d0');
    })
  })

})