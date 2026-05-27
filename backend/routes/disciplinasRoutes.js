const { Router } = require('express');
const { createDisciplina, listDisciplinas } = require('../controllers/disciplinasController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

const routes = Router();

routes.post('/disciplinas', authMiddleware, requireAdmin, createDisciplina);
routes.get('/disciplinas', authMiddleware, requireAdmin, listDisciplinas);

// Admin: atualizar disciplina por id
const { updateDisciplinaById } = require('../controllers/disciplinasController');
routes.put('/disciplinas/:id', authMiddleware, requireAdmin, updateDisciplinaById);

module.exports = routes;
