const Promise = require('bluebird');
const Mservice = require('mservice');
const path = require('path');
const merge = require('lodash/merge');
const request = require('request-promise');

/**
 * @class Proxy
 */
module.exports = class Proxy extends Mservice {

  /**
   * Configuration options for the service
   * @type {Object}
   */
  static defaultOpts = {
    debug: process.env.NODE_ENV === 'development',
    amqp: {
      queue: 'ms-proxy',
      prefix: 'ms-proxy',
      postfix: path.join(__dirname, 'actions'),
      initRoutes: true,
      initRouter: true,
    },
    redis: {
      options: {
        keyPrefix: '{ms-proxy}',
      },
    },
    plugins: ['validator', 'logger', 'amqp', 'redisSentinel'],
    logger: process.env.NODE_ENV === 'development',
    validator: ['../schemas'],
    defaultIp: null,
    echoOpts: {
      url: 'https://localhost',
      method: 'POST',
      timeout: 10000,
      strictSSL: false,
      json: true,
    },
  };

  /**
   * @namespace Users
   * @param  {Object} opts
   * @return {Users}
   */
  constructor(opts = {}) {
    super(merge({}, Proxy.defaultOpts, opts));
    const config = this.config;

    const { error } = this.validateSync('config', config);
    if (error) {
      this.log.fatal('Invalid configuration:', error.toJSON());
      throw error;
    }
  }

  /**
   * Getter for configuration
   * @return {Object}
   */
  get config() {
    return this._config;
  }

  init() {
    const { config: { defaultIp, echoOpts } } = this;

    if (defaultIp) {
      this.defaultIp = defaultIp;
    }

    return request(echoOpts).then(data => {
      if (!data.ip) {
        throw new Error('cant determine current up');
      }

      this.defaultIp = data.ip;
    });
  }

  connect() {
    return Promise
      .join(super.connect(), this.init())
      .tap(() => {
        this.log.info('communicating via external ip %s', this.defaultIp);
      });
  }

};
