const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { requestIdMiddleware } = require('./middleware/requestIdMiddleware');
const routes = require('./routes');

const app = express();

app.disable('x-powered-by');

app.use(requestIdMiddleware);
app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = corsOrigin
  ? corsOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : null;

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: allowedOrigins || (isProduction ? false : true),
    credentials: false,
  }),
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

module.exports = { app };
