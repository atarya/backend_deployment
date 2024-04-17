const redis = require('redis');

const client = redis.createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

client.on('error', (err) => console.log('Redis Client Error'.bgRed.white, err.toString()));

(async () => {
  try {
    await client.connect();
    console.log('SERVER Connected to RedisDB'.bgMagenta.black);
  } catch (err) {
    console.error('REDIS connection error:'.bgRed.white, err);
  }
})();

module.exports = { client };
