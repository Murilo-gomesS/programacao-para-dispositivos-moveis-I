const { pool } = require('../database/connection');

async function findAllDetailed() {
  const query = `
    SELECT
      d.id,
      d.nome,
      d.carga_horaria,
      d.curso,
      d.semestre,
      p.id AS professor_id,
      p.nome AS professor_nome,
      p.email AS professor_email
    FROM disciplinas d
    INNER JOIN professores p ON p.id = d.professor_id
    ORDER BY p.nome, d.curso, d.semestre, d.nome;
  `;

  const { rows } = await pool.query(query);
  return rows;
}

async function create({ nome, carga_horaria, professor_id, curso, semestre }) {
  const query = `
    INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [nome, carga_horaria, professor_id || null, curso, semestre];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function deleteById(id) {
  await pool.query('DELETE FROM disciplinas WHERE id = $1', [id]);
}

module.exports = { create, findAllDetailed, deleteById };
