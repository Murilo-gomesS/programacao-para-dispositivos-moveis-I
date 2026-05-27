const alunosModel = require('../models/alunosModel');
const { pool } = require('../database/connection');
const { logServerError } = require('../utils/errorUtils');

async function listAlunos(req, res) {
  try {
    const alunos = await alunosModel.findAll();
    return res.json({ alunos });
  } catch (error) {
    logServerError(req, 'Erro ao listar alunos.', error);
    return res.status(500).json({ message: 'Erro ao listar alunos.' });
  }
}

async function createAluno(req, res) {
  try {
    const { nome, matricula, curso, email } = req.body;

    if (!nome || !matricula || !curso || !email) {
      return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email invalido.' });
    }

    const aluno = await alunosModel.create(req.body);
    return res.status(201).json({ message: 'Aluno cadastrado com sucesso.', aluno });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Matricula ou email ja cadastrado.' });
    }
    logServerError(req, 'Erro ao cadastrar aluno.', error);
    return res.status(500).json({ message: 'Erro ao cadastrar aluno.' });
  }
}

async function getMyAlunoProfile(req, res) {
  try {
    const alunoId = req.user?.aluno_id;

    const { rows } = await pool.query(
      `
        SELECT
          a.id,
          a.nome,
          a.matricula,
          a.curso,
          a.email,
          a.telefone,
          a.cep,
          a.endereco,
          a.cidade,
          a.estado
        FROM alunos a
        WHERE a.id = $1
        LIMIT 1;
      `,
      [alunoId],
    );

    const aluno = rows[0];

    if (!aluno) {
      return res.status(404).json({ message: 'Aluno nao encontrado.' });
    }

    return res.json({ aluno });
  } catch (error) {
    logServerError(req, 'Erro ao buscar perfil do aluno.', error);
    return res.status(500).json({ message: 'Erro ao buscar perfil do aluno.' });
  }
}

async function updateMyAlunoProfile(req, res) {
  const alunoId = req.user?.aluno_id;
  const { nome, email, telefone, cep, endereco, cidade, estado } = req.body;

  if (!alunoId) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email sao obrigatorios.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return res.status(400).json({ message: 'Email invalido.' });
  }

  try {
    const alunoQuery = `
      UPDATE alunos
      SET nome = $1,
          email = $2,
          telefone = $3,
          cep = $4,
          endereco = $5,
          cidade = $6,
          estado = $7
      WHERE id = $8
      RETURNING id, nome, matricula, curso, email, telefone, cep, endereco, cidade, estado;
    `;

    const alunoValues = [
      String(nome).trim(),
      String(email).trim(),
      telefone ? String(telefone).trim() : null,
      cep ? String(cep).trim() : null,
      endereco ? String(endereco).trim() : null,
      cidade ? String(cidade).trim() : null,
      estado ? String(estado).trim().toUpperCase() : null,
      alunoId,
    ];

    const alunoResult = await pool.query(alunoQuery, alunoValues);
    const aluno = alunoResult.rows[0];

    const usuarioQuery = `
      UPDATE usuarios
      SET nome = $1,
          email = $2
      WHERE aluno_id = $3
      RETURNING id, email, login, nome, perfil, aluno_id, professor_id;
    `;

    const usuarioResult = await pool.query(usuarioQuery, [
      aluno.nome,
      aluno.email,
      aluno.id,
    ]);

    return res.json({ aluno, usuario: usuarioResult.rows[0] });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Email ja cadastrado.' });
    }

    logServerError(req, 'Erro ao atualizar perfil do aluno.', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil do aluno.' });
  } finally {
  }
}

async function updateAlunoById(req, res) {
  try {
    const { id } = req.params;
    const { nome, matricula, curso, email, telefone, cep, endereco, cidade, estado } = req.body;

    if (!id) return res.status(400).json({ message: 'Id do aluno e obrigatorio.' });
    if (!nome || !matricula || !curso || !email) return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) return res.status(400).json({ message: 'Email invalido.' });

    const query = `
      UPDATE alunos
      SET nome = $1,
          matricula = $2,
          curso = $3,
          email = $4,
          telefone = $5,
          cep = $6,
          endereco = $7,
          cidade = $8,
          estado = $9
      WHERE id = $10
      RETURNING id, nome, matricula, curso, email, telefone, cep, endereco, cidade, estado;
    `;

    const values = [
      String(nome).trim(),
      String(matricula).trim(),
      String(curso).trim(),
      String(email).trim(),
      telefone ? String(telefone).trim() : null,
      cep ? String(cep).trim() : null,
      endereco ? String(endereco).trim() : null,
      cidade ? String(cidade).trim() : null,
      estado ? String(estado).trim().toUpperCase() : null,
      Number(id),
    ];

    const { rows } = await pool.query(query, values);
    const aluno = rows[0];

    if (!aluno) return res.status(404).json({ message: 'Aluno nao encontrado.' });

    // update usuario record if exists
    await pool.query(
      `UPDATE usuarios SET nome = $1, email = $2 WHERE aluno_id = $3 RETURNING id;`,
      [aluno.nome, aluno.email, aluno.id],
    );

    return res.json({ message: 'Aluno atualizado com sucesso.', aluno });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Matricula ou email ja cadastrado.' });
    }
    logServerError(req, 'Erro ao atualizar aluno.', error);
    return res.status(500).json({ message: 'Erro ao atualizar aluno.' });
  }
}

module.exports = { createAluno, listAlunos, getMyAlunoProfile, updateMyAlunoProfile, updateAlunoById };
