const { pool } = require('../database/connection');

async function findByMatricula(matricula) {
  const query = `
    SELECT
      a.nome AS aluno,
      d.nome AS disciplina,
      n.nota1,
      n.nota2
    FROM alunos a
    INNER JOIN notas n ON n.aluno_id = a.id
    INNER JOIN disciplinas d ON d.id = n.disciplina_id
    WHERE a.matricula = $1
    ORDER BY d.nome;
  `;

  const { rows } = await pool.query(query, [matricula]);

  if (rows.length === 0) {
    return null;
  }

  return {
    aluno: rows[0].aluno,
    disciplinas: rows.map((row) => ({
      nome: row.disciplina,
      nota1: Number(row.nota1),
      nota2: Number(row.nota2),
      media: Number(((Number(row.nota1) + Number(row.nota2)) / 2).toFixed(2)),
      situacao: (Number(row.nota1) + Number(row.nota2)) / 2 >= 6 ? 'Aprovado' : 'Reprovado',
    })),
  };
}

module.exports = { findByMatricula };
