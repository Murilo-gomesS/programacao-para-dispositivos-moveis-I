const { Router } = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const { listCursos, createCurso } = require('../controllers/cursosController');

const routes = Router();

routes.get('/cursos', authMiddleware, requireAdmin, listCursos);
routes.post('/cursos', authMiddleware, requireAdmin, createCurso);

module.exports = routes;