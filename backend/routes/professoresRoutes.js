const { Router } = require('express');
const { createProfessor, listProfessores, updateProfessorById, deleteProfessorById } = require('../controllers/professoresController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

const routes = Router();

routes.post('/professores', authMiddleware, requireAdmin, createProfessor);
routes.get('/professores', authMiddleware, listProfessores);

routes.put('/professores/:id', authMiddleware, requireAdmin, updateProfessorById);
routes.delete('/professores/:id', authMiddleware, requireAdmin, deleteProfessorById);

module.exports = routes;
