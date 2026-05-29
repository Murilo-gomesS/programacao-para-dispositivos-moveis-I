const { pool } = require('../database/connection');

async function findAll() {
  const { rows } = await pool.query(
    'SELECT id, nome, matricula, curso, semestre, email FROM alunos ORDER BY nome',
  );
  return rows;
}

async function create({
  nome,
  matricula,
  curso,
  semestre,
  email,
  telefone,
  cep,
  endereco,
  cidade,
  estado,
}) {
  const query = `
    INSERT INTO alunos (nome, matricula, curso, semestre, email, telefone, cep, endereco, cidade, estado)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  const values = [nome, matricula, curso, semestre, email, telefone, cep, endereco, cidade, estado];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function deleteById(id) {
  await pool.query('DELETE FROM alunos WHERE id = $1', [id]);
}

module.exports = { create, findAll, deleteById };
