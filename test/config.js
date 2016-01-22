global.Promise = require('bluebird');

global.AMQP = {
  connection: {
    host: process.env.RABBITMQ_PORT_5672_TCP_ADDR,
    port: process.env.RABBITMQ_PORT_5672_TCP_PORT,
  },
};

global.REDIS = {
  sentinels: [
    {
      host: process.env.REDIS_SENTINEL_PORT_26379_TCP_ADDR,
      port: process.env.REDIS_SENTINEL_PORT_26379_TCP_PORT,
    },
  ],
  name: 'mservice',
};
