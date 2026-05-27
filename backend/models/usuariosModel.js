const { pool } = require('../database/connection');

async function findByEmailOrLogin(identifier) {
  const value = String(identifier || '').trim().toLowerCase();

  const query = `
    SELECT
      id,
      email,
      login,
      senha_hash,
      nome,
      perfil,
      aluno_id,
      professor_id
    FROM usuarios
    WHERE LOWER(email) = $1 OR LOWER(login) = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [value]);
  return rows[0] || null;
}

async function create({ email, login, senha_hash, nome, perfil, aluno_id, professor_id }) {
  const query = `
    INSERT INTO usuarios (email, login, senha_hash, nome, perfil, aluno_id, professor_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, email, login, nome, perfil, aluno_id, professor_id;
  `;

  const values = [
    String(email).trim(),
    login ? String(login).trim() : null,
    senha_hash,
    String(nome).trim(),
    perfil,
    aluno_id || null,
    professor_id || null,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

module.exports = {
  findByEmailOrLogin,
  create,
};
