const { Router } = require('express');
const { createDisciplina, listDisciplinas, updateDisciplinaById, deleteDisciplinaById } = require('../controllers/disciplinasController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

const routes = Router();

routes.post('/disciplinas', authMiddleware, requireAdmin, createDisciplina);
routes.get('/disciplinas', authMiddleware, requireAdmin, listDisciplinas);

routes.put('/disciplinas/:id', authMiddleware, requireAdmin, updateDisciplinaById);
routes.delete('/disciplinas/:id', authMiddleware, requireAdmin, deleteDisciplinaById);

module.exports = routes;
