const { pool } = require('../database/connection');
const disciplinasModel = require('../models/disciplinasModel');
const { logServerError } = require('../utils/errorUtils');

async function listDisciplinas(req, res) {
  try {
    const disciplinas = await disciplinasModel.findAllDetailed();
    return res.json({ disciplinas });
  } catch (error) {
    logServerError(req, 'Erro ao listar disciplinas.', error);
    return res.status(500).json({ message: 'Erro ao listar disciplinas.' });
  }
}

async function createDisciplina(req, res) {
  try {
    const { nome, carga_horaria, curso, semestre, professor_id } = req.body;

    if (!nome || carga_horaria === undefined || !curso || semestre === undefined) {
      return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });
    }

    if (professor_id === undefined || professor_id === null) {
      return res.status(400).json({ message: 'Professor responsavel e obrigatorio.' });
    }

    if (Number.isNaN(Number(carga_horaria)) || Number(carga_horaria) <= 0) {
      return res.status(400).json({ message: 'Carga horaria invalida.' });
    }

    if (Number.isNaN(Number(semestre)) || Number(semestre) <= 0) {
      return res.status(400).json({ message: 'Semestre invalido.' });
    }

    if (!Number.isInteger(Number(semestre))) {
      return res.status(400).json({ message: 'Semestre deve ser um numero inteiro.' });
    }

    const { rowCount } = await pool.query('SELECT 1 FROM professores WHERE id = $1', [
      professor_id,
    ]);

    if (rowCount === 0) {
      return res.status(400).json({ message: 'Professor invalido.' });
    }

    const disciplina = await disciplinasModel.create(req.body);
    return res.status(201).json({ message: 'Disciplina cadastrada com sucesso.', disciplina });
  } catch (error) {
    if (error && error.code === '23503') {
      return res.status(400).json({ message: 'Professor invalido.' });
    }

    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Disciplina ja cadastrada.' });
    }
    logServerError(req, 'Erro ao cadastrar disciplina.', error);
    return res.status(500).json({ message: 'Erro ao cadastrar disciplina.' });
  }
}

async function updateDisciplinaById(req, res) {
  try {
    const { id } = req.params;
    const { nome, carga_horaria, curso, semestre, professor_id } = req.body;

    if (!id) return res.status(400).json({ message: 'Id da disciplina e obrigatorio.' });
    if (!nome || carga_horaria === undefined || !curso || semestre === undefined) {
      return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });
    }

    if (professor_id === undefined || professor_id === null) {
      return res.status(400).json({ message: 'Professor responsavel e obrigatorio.' });
    }

    if (Number.isNaN(Number(carga_horaria)) || Number(carga_horaria) <= 0) {
      return res.status(400).json({ message: 'Carga horaria invalida.' });
    }

    if (Number.isNaN(Number(semestre)) || Number(semestre) <= 0) {
      return res.status(400).json({ message: 'Semestre invalido.' });
    }

    if (!Number.isInteger(Number(semestre))) {
      return res.status(400).json({ message: 'Semestre deve ser um numero inteiro.' });
    }

    const { pool } = require('../database/connection');
    const { rowCount } = await pool.query('SELECT 1 FROM professores WHERE id = $1', [professor_id]);

    if (rowCount === 0) {
      return res.status(400).json({ message: 'Professor invalido.' });
    }

    const query = `
      UPDATE disciplinas
      SET nome = $1,
          carga_horaria = $2,
          curso = $3,
          semestre = $4,
          professor_id = $5
      WHERE id = $6
      RETURNING *;
    `;

    const values = [String(nome).trim(), Number(carga_horaria), String(curso).trim(), Number(semestre), Number(professor_id), Number(id)];

    const { rows } = await pool.query(query, values);
    const disciplina = rows[0];

    if (!disciplina) return res.status(404).json({ message: 'Disciplina nao encontrada.' });

    return res.json({ message: 'Disciplina atualizada com sucesso.', disciplina });
  } catch (error) {
    if (error && error.code === '23503') {
      return res.status(400).json({ message: 'Professor invalido.' });
    }

    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Disciplina ja cadastrada.' });
    }
    logServerError(req, 'Erro ao atualizar disciplina.', error);
    return res.status(500).json({ message: 'Erro ao atualizar disciplina.' });
  }
}

module.exports = { createDisciplina, listDisciplinas, updateDisciplinaById };
