const { Router } = require('express');
const { createUsuario } = require('../controllers/usuariosController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

const routes = Router();

routes.post('/usuarios', authMiddleware, requireAdmin, createUsuario);

module.exports = routes;
