const cursosModel = require('../models/cursosModel');
const { logServerError } = require('../utils/errorUtils');

async function listCursos(req, res) {
  try {
    const cursos = await cursosModel.findAll();
    return res.json({ cursos });
  } catch (error) {
    logServerError(req, 'Erro ao listar cursos.', error);
    return res.status(500).json({ message: 'Erro ao listar cursos.' });
  }
}

async function createCurso(req, res) {
  try {
    const nome = String(req.body?.nome || '').trim();
    if (!nome) {
      return res.status(400).json({ message: 'Nome do curso e obrigatorio.' });
    }

    const curso = await cursosModel.create(nome);
    return res.status(201).json({ message: 'Curso cadastrado com sucesso.', curso });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Curso ja cadastrado.' });
    }

    logServerError(req, 'Erro ao cadastrar curso.', error);
    return res.status(500).json({ message: 'Erro ao cadastrar curso.' });
  }
}

module.exports = { listCursos, createCurso };