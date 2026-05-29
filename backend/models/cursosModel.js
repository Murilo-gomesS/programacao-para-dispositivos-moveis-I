const { pool } = require('../database/connection');

async function findAll() {
  const { rows } = await pool.query('SELECT id, nome FROM cursos ORDER BY nome');
  return rows;
}

async function create(nome) {
  const { rows } = await pool.query('INSERT INTO cursos (nome) VALUES ($1) RETURNING id, nome;', [nome]);
  return rows[0];
}

module.exports = { findAll, create };