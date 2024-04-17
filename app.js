require('dotenv').config({ path: '../.env' });
require('./config/mongo');
require('./config/redis');
require('./config/adminCheck');

const colors = require('colors');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRouter = require('./api/routes/userRoutes');

const PORT = process.env.PORT || 3000;

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

colors.enable();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(limiter);

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 'script-src \'self\'');
  next();
});

app.get('/ping', (req, res) => {
  res.send('<h1>PONG</h1>');
});

app.use('/api', authRouter);

app.use((err, req, res, next) => {
  console.error(colors.bgRed.white(err.stack));
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`SERVER Started on PORT ${PORT}`.bgCyan.black);
});
