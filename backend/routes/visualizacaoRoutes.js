const { Router } = require('express');
const { getProfessorVisao, getAlunoVisao } = require('../controllers/visualizacaoController');
const { authMiddleware, requireProfessor, requireAluno } = require('../middleware/authMiddleware');

const routes = Router();

routes.get('/visao/professor', authMiddleware, requireProfessor, getProfessorVisao);
routes.get('/visao/aluno', authMiddleware, requireAluno, getAlunoVisao);

module.exports = routes;
