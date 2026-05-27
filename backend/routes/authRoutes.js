const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { login } = require('../controllers/authController');

const routes = Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
});

routes.post('/login', loginLimiter, login);

module.exports = routes;
