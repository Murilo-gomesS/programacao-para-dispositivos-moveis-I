const { Router } = require('express');
const { createProfessor, listProfessores } = require('../controllers/professoresController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

const routes = Router();

routes.post('/professores', authMiddleware, requireAdmin, createProfessor);
routes.get('/professores', authMiddleware, listProfessores);

// Admin: atualizar professor por id
const { updateProfessorById } = require('../controllers/professoresController');
routes.put('/professores/:id', authMiddleware, requireAdmin, updateProfessorById);

module.exports = routes;
