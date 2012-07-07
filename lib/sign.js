/*
 * Tuppari authorization header createion module.
 */

var qs = require('querystring'),
  crypto = require('crypto'),
  url = require('url'),
  util = require('util');

// Utilities

function trim(s) {
  if (s) {
    return s.replace(/^\s*|\s*$/g, '');
  }
  return '';
}

function ISODateString(d) {
  function pad(n){
    return n < 10 ? '0' + n : n;
  }
  return d.getUTCFullYear()
    + pad(d.getUTCMonth()+1)
    + pad(d.getUTCDate()) + 'T'
    + pad(d.getUTCHours())
    + pad(d.getUTCMinutes())
    + pad(d.getUTCSeconds()) + 'Z'
}

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Returns the URI-encoded version of the absolute path component of the URI.
 * If the absolute path is empty, use a forward slash (/).
 *
 * @param {String} uri Request path
 * @return {String} Canonical URI
 */
function createCanonicalUri(uri) {
  return uri ? (uri == '' ? '/' : uri) : '/';
}

/**
 * Create query string.
 *
 * @param {String} queryString The query string of the HTTP request
 * @return {String} Cnononical query string
 */
function createCanonicalQueryString(queryString) {
  if (!queryString || queryString === '') {
    return ''
  }

  var params = qs.parse(queryString);
  var keys = Object.keys(params).sort();

  var result = [], i, len, key;
  for (i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    result.push(key + '=' + qs.escape(params[key]));
  }
  return result.join('&');
}

/**
 * Create canonical headers.
 *
 * 1. Convert all header names to lowercase and trim all header values
 * 2. Sort the headers by lower case character code
 * 3. For each header, append the lower case header name, followed by a colon, and append a newline.
 *
 * @param {Object} headers The map of HTTP request headers.
 * @return {String} Canonical headers
 */
function createCanonicalHeaders(headers) {
  if (!headers) {
    return '';
  }

  var headerNames = Object.keys(headers).sort();
  var len = headerNames.length;

  if (len === 0) {
    return '';
  }

  var result = [], i, key;
  for (i = 0; i < len; ++i) {
    key = headerNames[i];
    result.push(key.toLowerCase() + ':' + trim(headers[key]));
  }
  return result.join('\n');
}

/**
 * Create signed headers.
 *
 * 1. Convert all header names to lowercase and trim all header values
 * 2. Sort the headers by lower case character code
 * 3. Join the sorted header name list with semicolon (';')
 *
 * @param {Object} headers The map of HTTP request headers.
 * @return {String} Signed headers
 */
function createSignedHeaders(headers) {
  if (!headers) {
    return '';
  }

  var headerNames = Object.keys(headers).sort();
  var len = headerNames.length;

  if (len === 0) {
    return '';
  }

  var result = [], i, key;
  for (i = 0; i < len; ++i) {
    key = headerNames[i];
    result.push(key.toLowerCase());
  }
  return result.join(';');
}

/**
 * Calc a hash from the body of the HTTP request using a hash function that algorithm is SHA256.
 * Take the lower case base hex encoding of the hash function output.
 * If the body is empty, use the empty string as the input to the hash function.
 *
 * @param {String|Object} body The body of the HTTP request
 * @return {String} The SHA256 hash of the body
 */
function createBodyHash(body) {
  var hash = crypto.createHash('sha256');
  var data;

  if (!body) {
    data = '';
  } else {
    if (typeof body !== 'string') {
      body = JSON.stringify(body);
    }
    data = body;
  }

  return hash.update(data, 'utf8').digest('hex');
}

/**
 * Returns following data.
 *
 * CanonicalRequest =
 *    HTTPRequestMethod + '\n' +
 *    CanonicalURI + '\n' +
 *    CanonicalQueryString + '\n' +
 *    CanonicalHeaders + '\n' +
 *    SignedHeaders + '\n' +
 *    HexEncode(Hash(body))
 *
 * @param {String} method HTTP requet method (Such as GET, POST, etc)
 * @param {String} uri URI of the request
 * @param {String} queryString Query string of the request
 * @param {Object} headers The request header map of the request
 * @param {Object|String} body The body of the request
 * @return {String} Canonical request
 */
function createCanonicalRequest(method, uri, queryString, headers, body) {
  var result = [
    method,
    createCanonicalUri(uri),
    createCanonicalQueryString(queryString),
    createCanonicalHeaders(headers),
    createSignedHeaders(headers),
    createBodyHash(body)
  ];
  return result.join('\n');
}

/**
 * Returns following data.
 *
 * StringToSign =
 *   Algorithm + '\n' +
 *   RequestDate + '\n' +
 *   HexEncode(Hash(CanonicalRequest))
 *
 * @param {String} canonicalRequest The canonical request
 * @param {Date} requestDate The date of the request
 * @return {String} The string to sign
 */
function createStringToSign(canonicalRequest, requestDate) {
  var hash = crypto.createHash('sha256');

  var result = [
    'SHA256',
    ISODateString(requestDate),
    hash.update(canonicalRequest, 'utf8').digest('hex')
  ];
  return result.join('\n');
}

/**
 * Create a signature from secret key and string to sign.
 *
 * SecretKey = Your Secret Key (Account secret key or application secret key)
 * DerivedSigningKey = HMAC(HMAC("TUPPARI" + SecretKey, RequestDate), Host)
 * Signature = HMAC(DerivedSigningKey, StringToSign)
 *
 * @param {String} secretKey The secret key
 * @param {String} stringToSign The string you want to sign
 * @param {Date} requestDate The date of the request
 * @param {String} host The hostname of the tuppari admin server
 * @return {String} Signature of the stringToSign
 */
function createSignature(secretKey, stringToSign, requestDate, host) {
  var derivedSigningKey = hmac(hmac("TUPPARI" + secretKey, ISODateString(requestDate)), host);
  var signature = hmac(derivedSigningKey, stringToSign);
  return signature;
}

/**
 * Create signed request config.
 *
 * @param {String} method HTTP requet method (Such as GET, POST, etc)
 * @param {String} uri URI of the request
 * @param {String} operation The operation name
 * @param {Object|String} body The body of the request
 * @param {String} accessKeyId Access key id
 * @param {String} secretKey Access secret key
 * @return {Object} The request config
 */
function createSignedRequestConfig(method, uri, operation, body, accessKeyId, secretKey) {
  var puri = url.parse(uri);
  var hostname = puri.host;
  var path = puri.pathname;
  var query = puri.query;
  var now = new Date();
  var headers = {
    "Host": hostname,
    "Content-Type": "application/json",
    "X-Tuppari-Date": now.toGMTString(),
    "X-Tuppari-Operation": operation
  };

  headers["Authorization"] = createAuthorizationHeader(method, hostname, path, query, headers, body, now, accessKeyId, secretKey);

  var options = {
    uri: uri,
    body: JSON.stringify(body),
    headers: headers
  };

  return options;
}

/**
 * Create authorization header.
 *
 * @param {String} method The HTTP method of the request
 * @param {String} hostname The host name of the API server
 * @param {String} path The absolute path of the request
 * @param {String} query The query string of the request
 * @param {Object} headers The map of HTTP request headers
 * @param {String|Object} body The body of the request
 * @param {Date} requestDate The date of the request
 * @param {String} accessKeyId Access key id
 * @param {String} secretKey Access secret key
 * @return {String} Authorization header string
 */
function createAuthorizationHeader(method, hostname, path, query, headers, body, requestDate, accessKeyId, secretKey) {
  var signedHeaders = createSignedHeaders(headers);
  var canonicalRequest = createCanonicalRequest(method, path, query, headers, body);
  var stringToSign = createStringToSign(canonicalRequest, requestDate);
  var signature = createSignature(secretKey, stringToSign, requestDate, hostname);
  return util.format('HMAC-SHA256 Credential=%s,SignedHeaders=%s,Signature=%s', accessKeyId, signedHeaders, signature);
}

exports.createCanonicalUri = createCanonicalUri;
exports.createCanonicalQueryString = createCanonicalQueryString;
exports.createCanonicalHeaders = createCanonicalHeaders;
exports.createSignedHeaders = createSignedHeaders;
exports.createBodyHash = createBodyHash;
exports.createCanonicalRequest = createCanonicalRequest;
exports.createStringToSign = createStringToSign;
exports.createSignature = createSignature;
exports.createSignedRequestConfig = createSignedRequestConfig;
exports.createAuthorizationHeader = createAuthorizationHeader;
exports.ISODateString = ISODateString;
