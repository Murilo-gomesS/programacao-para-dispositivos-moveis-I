const { Router } = require('express');
const {
	createAluno,
	listAlunos,
	getMyAlunoProfile,
	updateMyAlunoProfile,
	updateAlunoById,
} = require('../controllers/alunosController');
const { authMiddleware, requireAdmin, requireAluno } = require('../middleware/authMiddleware');

const routes = Router();

routes.get('/alunos/me', authMiddleware, requireAluno, getMyAlunoProfile);
routes.put('/alunos/me', authMiddleware, requireAluno, updateMyAlunoProfile);
routes.post('/alunos', authMiddleware, requireAdmin, createAluno);
routes.get('/alunos', authMiddleware, requireAdmin, listAlunos);

// Admin: atualizar aluno por id
routes.put('/alunos/:id', authMiddleware, requireAdmin, updateAlunoById);

module.exports = routes;
