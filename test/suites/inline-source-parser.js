const assert = require('assert');
const path = require('path');
const { start, stop } = require('../helpers.js');

describe('inline parser', function suite() {
  before(start);
  after(stop);

  const parser = require('../../src/sources/inline.js');
  const sources = {
    external: null,
    internal: [
      path.resolve(__dirname, '../fixtures/proxies.txt'),
      'https://goog.proxy:4000',
      undefined,
    ],
  };

  function proxyStruct(protocol, hostname, port, auth) {
    const obj = { protocol, hostname, port };
    if (auth) {
      obj.auth = auth;
    }

    return obj;
  }

  it('parses mixed proxy data correctly', function test() {
    this.service.config.proxies = sources;
    return parser.call(this.service).then(proxiesBySources => {
      assert.deepEqual(proxiesBySources, {
        external: [],
        internal: [
          proxyStruct('http:', 'valid.proxy', '80'),
          proxyStruct('socks:', '231.33.12.32', '5555'),
          proxyStruct('http:', 'proxydude.com', '8080', 'correct:auth'),
          proxyStruct('https:', 'goog.proxy', '4000'),
        ],
      }, 'failed to omit bad proxies');
    });
  });
});
