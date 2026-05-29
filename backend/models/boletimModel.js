const { pool } = require('../database/connection');

async function findByMatricula(matricula, professorId = null) {
  const query = `
    SELECT
      a.nome AS aluno,
      d.nome AS disciplina,
      n.nota1,
      n.nota2,
      n.media,
      n.situacao
    FROM alunos a
    INNER JOIN matriculas m ON m.aluno_id = a.id
    INNER JOIN disciplinas d ON d.id = m.disciplina_id
    LEFT JOIN notas n ON n.aluno_id = a.id AND n.disciplina_id = d.id
    WHERE a.matricula = $1
      AND ($2::int IS NULL OR d.professor_id = $2)
    ORDER BY d.nome;
  `;

  const { rows } = await pool.query(query, [matricula, professorId]);

  if (rows.length === 0) {
    return null;
  }

  return {
    aluno: rows[0].aluno,
    disciplinas: rows.map((row) => ({
      nome: row.disciplina,
      nota1: row.nota1 === null || row.nota1 === undefined ? null : Number(row.nota1),
      nota2: row.nota2 === null || row.nota2 === undefined ? null : Number(row.nota2),
      media:
        row.media === null || row.media === undefined
          ? null
          : Number(row.media),
      situacao: row.situacao || null,
    })),
  };
}

module.exports = { findByMatricula };
