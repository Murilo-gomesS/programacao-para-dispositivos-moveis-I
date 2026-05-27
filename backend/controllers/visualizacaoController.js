const { pool } = require('../database/connection');
const { logServerError } = require('../utils/errorUtils');

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toNumberWithFallback(value, fallback) {
  const parsed = toNumber(value);
  return parsed === null ? fallback : parsed;
}

function computeGrade(row) {
  const nota1 = toNumber(row.nota1);
  const nota2 = toNumber(row.nota2);
  const mediaFromDb = toNumber(row.media);

  const hasNotas = nota1 !== null && nota2 !== null;
  const media = mediaFromDb !== null ? mediaFromDb : hasNotas ? Number((((nota1 + nota2) / 2)).toFixed(2)) : null;
  const situacao = row.situacao ? String(row.situacao) : media !== null ? (media >= 6 ? 'Aprovado' : 'Reprovado') : null;

  return {
    nota1,
    nota2,
    media,
    situacao,
  };
}

async function getProfessorVisao(req, res) {
  try {
    const professorId = req.user?.professor_id;

    const professorRes = await pool.query('SELECT id, nome FROM professores WHERE id = $1', [
      professorId,
    ]);

    const professor = professorRes.rows[0];
    if (!professor) {
      return res.status(404).json({ message: 'Professor nao encontrado.' });
    }

    const query = `
      SELECT
        d.id AS disciplina_id,
        d.nome AS disciplina_nome,
        d.curso AS disciplina_curso,
        d.semestre AS disciplina_semestre,
        a.id AS aluno_id,
        a.nome AS aluno_nome,
        a.matricula AS aluno_matricula,
        n.nota1,
        n.nota2,
        n.media,
        n.situacao
      FROM disciplinas d
      LEFT JOIN matriculas m ON m.disciplina_id = d.id
      LEFT JOIN alunos a ON a.id = m.aluno_id
      LEFT JOIN notas n ON n.disciplina_id = d.id AND n.aluno_id = a.id
      WHERE d.professor_id = $1
      ORDER BY d.nome, a.nome;
    `;

    const { rows } = await pool.query(query, [professorId]);

    const disciplinasMap = new Map();

    for (const row of rows) {
      const disciplinaId = row.disciplina_id;
      const existing = disciplinasMap.get(disciplinaId);
      const disciplina =
        existing ||
        {
          id: disciplinaId,
          nome: row.disciplina_nome,
          curso: row.disciplina_curso,
          semestre: toNumber(row.disciplina_semestre) || 0,
          alunos: [],
        };

      if (row.aluno_id) {
        const grade = computeGrade(row);

        disciplina.alunos.push({
          id: row.aluno_id,
          nome: row.aluno_nome,
          matricula: row.aluno_matricula,
          nota1: grade.nota1,
          nota2: grade.nota2,
          media: grade.media,
          situacao: grade.situacao,
        });
      }

      if (!existing) {
        disciplinasMap.set(disciplinaId, disciplina);
      }
    }

    const disciplinas = Array.from(disciplinasMap.values());

    // Lista unica de alunos ensinados (a partir das notas).
    const alunosMap = new Map();
    for (const d of disciplinas) {
      for (const a of d.alunos) {
        alunosMap.set(a.id, { id: a.id, nome: a.nome, matricula: a.matricula });
      }
    }

    return res.json({
      professor,
      disciplinas,
      alunos: Array.from(alunosMap.values()).sort((a, b) => a.nome.localeCompare(b.nome)),
    });
  } catch (error) {
    logServerError(req, 'Erro ao buscar visao do professor.', error);
    return res.status(500).json({ message: 'Erro ao buscar visao do professor.' });
  }
}

async function getAlunoVisao(req, res) {
  try {
    const alunoId = req.user?.aluno_id;

    const alunoRes = await pool.query('SELECT id, nome, matricula FROM alunos WHERE id = $1', [alunoId]);
    const aluno = alunoRes.rows[0];

    if (!aluno) {
      return res.status(404).json({ message: 'Aluno nao encontrado.' });
    }

    const query = `
      SELECT
        d.id AS disciplina_id,
        d.nome AS disciplina_nome,
        d.curso AS disciplina_curso,
        d.semestre AS disciplina_semestre,
        p.id AS professor_id,
        p.nome AS professor_nome,
        n.nota1,
        n.nota2,
        n.media,
        n.situacao
      FROM matriculas m
      INNER JOIN disciplinas d ON d.id = m.disciplina_id
      INNER JOIN professores p ON p.id = d.professor_id
      LEFT JOIN notas n ON n.aluno_id = m.aluno_id AND n.disciplina_id = m.disciplina_id
      WHERE m.aluno_id = $1
      ORDER BY d.nome;
    `;

    const { rows } = await pool.query(query, [alunoId]);

    const disciplinas = rows.map((row) => {
      const grade = computeGrade(row);

      return {
      id: row.disciplina_id,
      nome: row.disciplina_nome,
      curso: row.disciplina_curso,
      semestre: toNumber(row.disciplina_semestre) || 0,
      professor: {
        id: row.professor_id,
        nome: row.professor_nome,
      },
      nota1: grade.nota1,
      nota2: grade.nota2,
      media: grade.media,
      situacao: grade.situacao,
      };
    });

    return res.json({
      aluno: { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula },
      disciplinas,
    });
  } catch (error) {
    logServerError(req, 'Erro ao buscar visao do aluno.', error);
    return res.status(500).json({ message: 'Erro ao buscar visao do aluno.' });
  }
}

module.exports = { getProfessorVisao, getAlunoVisao };
