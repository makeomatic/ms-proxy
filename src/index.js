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
      url: 'https://echo.ark.com',
      method: 'POST',
      timeout: 10000,
      strictSSL: false,
      json: true,
    },
    proxies: {
      // must inclue key: path, strings, array of strings
    },
    // after check is completed - schedule the next one in 10 minutes
    pulse: 10 * 60 * 1000,
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

  /**
   * In this function we detect currently used external ip address
   */
  resolveExternalAdress() {
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

  /**
   * Init current service and plugins
   */
  connect() {
    return Promise
      .join(
        super.connect(),
        this.resolveExternalAdress()
      )
      .tap(() => {
        this.log.info('communicating via external ip %s', this.defaultIp);
      });
  }

};
