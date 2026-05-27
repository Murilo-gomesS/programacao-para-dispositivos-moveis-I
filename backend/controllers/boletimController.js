const boletimModel = require('../models/boletimModel');
const { pool } = require('../database/connection');
const { logServerError } = require('../utils/errorUtils');

async function listNotas(req, res) {
  try {
    const query = `
      SELECT
        n.id,
        a.nome AS aluno_nome,
        a.matricula AS aluno_matricula,
        d.nome AS disciplina_nome,
        d.curso AS disciplina_curso,
        d.semestre AS disciplina_semestre,
        n.nota1,
        n.nota2
      FROM notas n
      INNER JOIN alunos a ON a.id = n.aluno_id
      INNER JOIN disciplinas d ON d.id = n.disciplina_id
      ORDER BY a.nome, d.nome;
    `;

    const { rows } = await pool.query(query);

    const notas = rows.map((row) => {
      const nota1 = Number(row.nota1);
      const nota2 = Number(row.nota2);
      const media = Number(((nota1 + nota2) / 2).toFixed(2));
      const situacao = media >= 6 ? 'Aprovado' : 'Reprovado';

      return {
        id: row.id,
        aluno_nome: row.aluno_nome,
        aluno_matricula: row.aluno_matricula,
        disciplina_nome: row.disciplina_nome,
        disciplina_curso: row.disciplina_curso,
        disciplina_semestre: row.disciplina_semestre,
        nota1,
        nota2,
        media,
        situacao,
      };
    });

    return res.json({ notas });
  } catch (error) {
    logServerError(req, 'Erro ao listar notas.', error);
    return res.status(500).json({ message: 'Erro ao listar notas.' });
  }
}

async function upsertNotaProfessor(req, res) {
  try {
    const professorId = req.user?.professor_id;
    const { alunoId, disciplinaId, nota1, nota2 } = req.body;

    if (!professorId) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const parsedAlunoId = Number(alunoId);
    const parsedDisciplinaId = Number(disciplinaId);
    const parsedNota1 = Number(nota1);
    const parsedNota2 = Number(nota2);

    if (!parsedAlunoId || !parsedDisciplinaId) {
      return res.status(400).json({ message: 'Aluno e disciplina sao obrigatorios.' });
    }

    if (!Number.isFinite(parsedNota1) || !Number.isFinite(parsedNota2)) {
      return res.status(400).json({ message: 'Notas invalidas.' });
    }

    if (parsedNota1 < 0 || parsedNota1 > 10 || parsedNota2 < 0 || parsedNota2 > 10) {
      return res.status(400).json({ message: 'Notas devem estar entre 0 e 10.' });
    }

    const ownershipQuery = `
      SELECT 1
      FROM disciplinas d
      INNER JOIN matriculas m ON m.disciplina_id = d.id
      WHERE d.id = $1
        AND d.professor_id = $2
        AND m.aluno_id = $3
      LIMIT 1;
    `;

    const ownership = await pool.query(ownershipQuery, [parsedDisciplinaId, professorId, parsedAlunoId]);

    if (ownership.rowCount === 0) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const media = Number(((parsedNota1 + parsedNota2) / 2).toFixed(2));
    const situacao = media >= 6 ? 'Aprovado' : 'Reprovado';

    const query = `
      INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (aluno_id, disciplina_id)
      DO UPDATE SET
        nota1 = EXCLUDED.nota1,
        nota2 = EXCLUDED.nota2,
        media = EXCLUDED.media,
        situacao = EXCLUDED.situacao
      RETURNING id, aluno_id, disciplina_id, nota1, nota2, media, situacao;
    `;

    const { rows } = await pool.query(query, [
      parsedAlunoId,
      parsedDisciplinaId,
      parsedNota1,
      parsedNota2,
      media,
      situacao,
    ]);

    return res.json({ nota: rows[0] });
  } catch (error) {
    logServerError(req, 'Erro ao atualizar nota.', error);
    return res.status(500).json({ message: 'Erro ao atualizar nota.' });
  }
}

async function upsertNotaAdmin(req, res) {
  try {
    const { alunoId, disciplinaId, nota1, nota2 } = req.body;

    const parsedAlunoId = Number(alunoId);
    const parsedDisciplinaId = Number(disciplinaId);
    const parsedNota1 = Number(nota1);
    const parsedNota2 = Number(nota2);

    if (!parsedAlunoId || !parsedDisciplinaId) {
      return res.status(400).json({ message: 'Aluno e disciplina sao obrigatorios.' });
    }

    if (!Number.isFinite(parsedNota1) || !Number.isFinite(parsedNota2)) {
      return res.status(400).json({ message: 'Notas invalidas.' });
    }

    if (parsedNota1 < 0 || parsedNota1 > 10 || parsedNota2 < 0 || parsedNota2 > 10) {
      return res.status(400).json({ message: 'Notas devem estar entre 0 e 10.' });
    }

    const media = Number(((parsedNota1 + parsedNota2) / 2).toFixed(2));
    const situacao = media >= 6 ? 'Aprovado' : 'Reprovado';

    const query = `
      INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (aluno_id, disciplina_id)
      DO UPDATE SET
        nota1 = EXCLUDED.nota1,
        nota2 = EXCLUDED.nota2,
        media = EXCLUDED.media,
        situacao = EXCLUDED.situacao
      RETURNING id, aluno_id, disciplina_id, nota1, nota2, media, situacao;
    `;

    const { rows } = await pool.query(query, [parsedAlunoId, parsedDisciplinaId, parsedNota1, parsedNota2, media, situacao]);

    return res.json({ nota: rows[0] });
  } catch (error) {
    logServerError(req, 'Erro ao atualizar nota (admin).', error);
    return res.status(500).json({ message: 'Erro ao atualizar nota.' });
  }
}

async function getBoletimByMatricula(req, res) {
  try {
    const { matricula } = req.params;

    if (req.user?.perfil === 'Aluno') {
      const alunoId = req.user?.aluno_id;
      if (!alunoId) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const { rows } = await pool.query('SELECT matricula FROM alunos WHERE id = $1', [alunoId]);
      const ownMatricula = rows[0]?.matricula;

      if (!ownMatricula || String(ownMatricula) !== String(matricula)) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    }

    if (req.user?.perfil === 'Professor') {
      const professorId = req.user?.professor_id;

      if (!professorId) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const query = `
        SELECT 1
        FROM notas n
        INNER JOIN disciplinas d ON d.id = n.disciplina_id
        INNER JOIN alunos a ON a.id = n.aluno_id
        WHERE d.professor_id = $1
          AND a.matricula = $2
        LIMIT 1;
      `;

      const { rowCount } = await pool.query(query, [professorId, String(matricula)]);

      if (rowCount === 0) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }
    }

    if (req.user?.perfil !== 'Administrador' && req.user?.perfil !== 'Professor' && req.user?.perfil !== 'Aluno') {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const boletim = await boletimModel.findByMatricula(matricula);

    if (!boletim) {
      return res.status(404).json({ message: 'Aluno nao encontrado.' });
    }

    return res.json(boletim);
  } catch (error) {
    logServerError(req, 'Erro ao buscar boletim.', error);
    return res.status(500).json({ message: 'Erro ao buscar boletim.' });
  }
}

module.exports = { getBoletimByMatricula, listNotas, upsertNotaProfessor, upsertNotaAdmin };
