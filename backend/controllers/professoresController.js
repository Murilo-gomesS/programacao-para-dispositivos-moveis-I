const professoresModel = require('../models/professoresModel');
const { pool } = require('../database/connection');
const { logServerError } = require('../utils/errorUtils');

async function listProfessores(req, res) {
  try {
    const professores =
      req.user?.perfil === 'Administrador'
        ? await professoresModel.findAll()
        : await professoresModel.findAllPublic();
    return res.json({ professores });
  } catch (error) {
    logServerError(req, 'Erro ao listar professores.', error);
    return res.status(500).json({ message: 'Erro ao listar professores.' });
  }
}

async function createProfessor(req, res) {
  try {
    const { nome, titulacao, area, tempo_docencia, email } = req.body;

    if (!nome || !titulacao || !area || tempo_docencia === undefined || !email) {
      return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email invalido.' });
    }

    if (Number.isNaN(Number(tempo_docencia)) || Number(tempo_docencia) <= 0) {
      return res.status(400).json({ message: 'Tempo de docencia invalido.' });
    }

    const professor = await professoresModel.create(req.body);
    return res.status(201).json({ message: 'Professor cadastrado com sucesso.', professor });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Email ja cadastrado.' });
    }
    logServerError(req, 'Erro ao cadastrar professor.', error);
    return res.status(500).json({ message: 'Erro ao cadastrar professor.' });
  }
}

async function updateProfessorById(req, res) {
  try {
    const { id } = req.params;
    const { nome, titulacao, area, tempo_docencia, email } = req.body;

    if (!id) return res.status(400).json({ message: 'Id do professor e obrigatorio.' });
    if (!nome || !titulacao || !area || tempo_docencia === undefined || !email) {
      return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });
    }

    if (Number.isNaN(Number(tempo_docencia)) || Number(tempo_docencia) <= 0) {
      return res.status(400).json({ message: 'Tempo de docencia invalido.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) return res.status(400).json({ message: 'Email invalido.' });

    const query = `
      UPDATE professores
      SET nome = $1,
          titulacao = $2,
          area = $3,
          tempo_docencia = $4,
          email = $5
      WHERE id = $6
      RETURNING id, nome, titulacao, area, tempo_docencia, email;
    `;

    const values = [String(nome).trim(), String(titulacao).trim(), String(area).trim(), Number(tempo_docencia), String(email).trim(), Number(id)];

    const { rows } = await pool.query(query, values);
    const professor = rows[0];

    if (!professor) {
      return res.status(404).json({ message: 'Professor nao encontrado.' });
    }

    await pool.query('UPDATE usuarios SET nome = $1, email = $2 WHERE professor_id = $3', [professor.nome, professor.email, professor.id]);

    return res.json({ message: 'Professor atualizado com sucesso.', professor });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Email ja cadastrado.' });
    }
    logServerError(req, 'Erro ao atualizar professor.', error);
    return res.status(500).json({ message: 'Erro ao atualizar professor.' });
  }
}

async function deleteProfessorById(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Id do professor e obrigatorio.' });
    }

    const professorId = Number(id);
    await client.query('BEGIN');

    const { rowCount } = await client.query('SELECT 1 FROM professores WHERE id = $1', [professorId]);
    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Professor nao encontrado.' });
    }

    const { rows: disciplinas } = await client.query('SELECT id FROM disciplinas WHERE professor_id = $1', [professorId]);
    const disciplinaIds = disciplinas.map((row) => row.id);

    if (disciplinaIds.length > 0) {
      await client.query('DELETE FROM notas WHERE disciplina_id = ANY($1::int[])', [disciplinaIds]);
      await client.query('DELETE FROM matriculas WHERE disciplina_id = ANY($1::int[])', [disciplinaIds]);
      await client.query('DELETE FROM disciplinas WHERE id = ANY($1::int[])', [disciplinaIds]);
    }

    await client.query('DELETE FROM usuarios WHERE professor_id = $1', [professorId]);
    await client.query('DELETE FROM professores WHERE id = $1', [professorId]);

    await client.query('COMMIT');
    return res.json({ message: 'Professor removido com sucesso.' });
  } catch (error) {
    await client.query('ROLLBACK');
    logServerError(req, 'Erro ao remover professor.', error);
    return res.status(500).json({ message: 'Erro ao remover professor.' });
  } finally {
    client.release();
  }
}

module.exports = { createProfessor, listProfessores, updateProfessorById, deleteProfessorById };
