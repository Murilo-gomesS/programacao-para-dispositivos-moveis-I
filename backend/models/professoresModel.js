const { pool } = require('../database/connection');

async function findAll() {
  const { rows } = await pool.query(
    'SELECT id, nome, titulacao, area, tempo_docencia, email FROM professores ORDER BY nome',
  );
  return rows;
}

async function findAllPublic() {
  const { rows } = await pool.query('SELECT id, nome FROM professores ORDER BY nome');
  return rows;
}

async function create({ nome, titulacao, area, tempo_docencia, email }) {
  const query = `
    INSERT INTO professores (nome, titulacao, area, tempo_docencia, email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [nome, titulacao, area, tempo_docencia, email];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

module.exports = { create, findAll, findAllPublic };
