const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('SERVER Connected to MongoDB'.bgYellow.black))
  .catch(err => console.error('MongoDB connection error:'.bgRed.white, err));

module.exports = { mongoose };
