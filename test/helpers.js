const Service = require('../src');

exports.start = function start() {
  this.service = new Service({ redis: global.REDIS, amqp: global.AMQP });
  return this.service.connect();
};

exports.stop = function stop() {
  return this.service && this.service.close().reflect();
};
