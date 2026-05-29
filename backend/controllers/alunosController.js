const alunosModel = require('../models/alunosModel');
const { pool } = require('../database/connection');
const { logServerError } = require('../utils/errorUtils');

async function cursoExiste(client, curso) {
  const { rowCount } = await client.query('SELECT 1 FROM cursos WHERE nome = $1', [curso]);
  return rowCount > 0;
}

async function listAlunos(req, res) {
  try {
    const alunos = await alunosModel.findAll();
    return res.json({ alunos });
  } catch (error) {
    logServerError(req, 'Erro ao listar alunos.', error);
    return res.status(500).json({ message: 'Erro ao listar alunos.' });
  }
}

async function createAluno(req, res) {
  try {
    const { nome, matricula, curso, semestre, email, disciplinaIds } = req.body;

    if (!nome || !matricula || !curso || semestre === undefined || !email) {
      return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });
    }

    const semestreNumero = Number(semestre);
    if (!Number.isInteger(semestreNumero) || semestreNumero <= 0) {
      return res.status(400).json({ message: 'Semestre invalido.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email invalido.' });
    }

    const cursoNormalizado = String(curso).trim();
    const disciplinaIdsRecebidos = Array.isArray(disciplinaIds)
      ? Array.from(new Set(disciplinaIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)))
      : [];

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (!(await cursoExiste(client, cursoNormalizado))) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Curso invalido.' });
      }

      let disciplinaIdsValidos = disciplinaIdsRecebidos;

      if (disciplinaIdsValidos.length === 0) {
        const disciplinasDefaultRes = await client.query(
          `
            SELECT id
            FROM disciplinas
            WHERE curso = $1 AND semestre = $2
            ORDER BY nome;
          `,
          [cursoNormalizado, semestreNumero],
        );

        disciplinaIdsValidos = disciplinasDefaultRes.rows.map((row) => row.id);
      }

      if (disciplinaIdsValidos.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'Nenhuma disciplina encontrada para o curso e semestre informados.',
        });
      }

      const disciplinasValidacao = await client.query(
        `
          SELECT id
          FROM disciplinas
          WHERE id = ANY($1::int[])
            AND curso = $2
            AND semestre = $3;
        `,
        [disciplinaIdsValidos, cursoNormalizado, semestreNumero],
      );

      if (disciplinasValidacao.rowCount !== disciplinaIdsValidos.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'Uma ou mais disciplinas selecionadas nao pertencem ao curso e semestre do aluno.',
        });
      }

      const alunoResult = await client.query(
        `
          INSERT INTO alunos (nome, matricula, curso, semestre, email, telefone, cep, endereco, cidade, estado)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `,
        [
          String(nome).trim(),
          String(matricula).trim(),
          cursoNormalizado,
          semestreNumero,
          String(email).trim(),
          req.body.telefone ? String(req.body.telefone).trim() : null,
          req.body.cep ? String(req.body.cep).trim() : null,
          req.body.endereco ? String(req.body.endereco).trim() : null,
          req.body.cidade ? String(req.body.cidade).trim() : null,
          req.body.estado ? String(req.body.estado).trim().toUpperCase() : null,
        ],
      );

      const aluno = alunoResult.rows[0];

      for (const disciplinaId of disciplinaIdsValidos) {
        await client.query(
          'INSERT INTO matriculas (aluno_id, disciplina_id) VALUES ($1, $2)',
          [aluno.id, disciplinaId],
        );
      }

      await client.query('COMMIT');
      return res.status(201).json({ message: 'Aluno cadastrado com sucesso.', aluno });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Matricula ou email ja cadastrado.' });
    }
    logServerError(req, 'Erro ao cadastrar aluno.', error);
    return res.status(500).json({ message: 'Erro ao cadastrar aluno.' });
  }
}

async function getMyAlunoProfile(req, res) {
  try {
    const alunoId = req.user?.aluno_id;

    const { rows } = await pool.query(
      `
        SELECT
          a.id,
          a.nome,
          a.matricula,
          a.curso,
          a.semestre,
          a.email,
          a.telefone,
          a.cep,
          a.endereco,
          a.cidade,
          a.estado
        FROM alunos a
        WHERE a.id = $1
        LIMIT 1;
      `,
      [alunoId],
    );

    const aluno = rows[0];

    if (!aluno) {
      return res.status(404).json({ message: 'Aluno nao encontrado.' });
    }

    return res.json({ aluno });
  } catch (error) {
    logServerError(req, 'Erro ao buscar perfil do aluno.', error);
    return res.status(500).json({ message: 'Erro ao buscar perfil do aluno.' });
  }
}

async function updateMyAlunoProfile(req, res) {
  const alunoId = req.user?.aluno_id;
  const { nome, email, telefone, cep, endereco, cidade, estado, semestre } = req.body;

  if (!alunoId) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email sao obrigatorios.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return res.status(400).json({ message: 'Email invalido.' });
  }

  try {
    const alunoQuery = `
      UPDATE alunos
      SET nome = $1,
          email = $2,
          telefone = $3,
          cep = $4,
          endereco = $5,
          cidade = $6,
          estado = $7,
          semestre = COALESCE($8, semestre)
      WHERE id = $9
      RETURNING id, nome, matricula, curso, semestre, email, telefone, cep, endereco, cidade, estado;
    `;

    const alunoValues = [
      String(nome).trim(),
      String(email).trim(),
      telefone ? String(telefone).trim() : null,
      cep ? String(cep).trim() : null,
      endereco ? String(endereco).trim() : null,
      cidade ? String(cidade).trim() : null,
      estado ? String(estado).trim().toUpperCase() : null,
      Number.isInteger(Number(semestre)) && Number(semestre) > 0 ? Number(semestre) : null,
      alunoId,
    ];

    const alunoResult = await pool.query(alunoQuery, alunoValues);
    const aluno = alunoResult.rows[0];

    const usuarioQuery = `
      UPDATE usuarios
      SET nome = $1,
          email = $2
      WHERE aluno_id = $3
      RETURNING id, email, login, nome, perfil, aluno_id, professor_id;
    `;

    const usuarioResult = await pool.query(usuarioQuery, [
      aluno.nome,
      aluno.email,
      aluno.id,
    ]);

    return res.json({ aluno, usuario: usuarioResult.rows[0] });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Email ja cadastrado.' });
    }

    logServerError(req, 'Erro ao atualizar perfil do aluno.', error);
    return res.status(500).json({ message: 'Erro ao atualizar perfil do aluno.' });
  } finally {
  }
}

async function updateAlunoById(req, res) {
  try {
    const { id } = req.params;
    const { nome, matricula, curso, semestre, email, telefone, cep, endereco, cidade, estado } = req.body;

    if (!id) return res.status(400).json({ message: 'Id do aluno e obrigatorio.' });
    if (!nome || !matricula || !curso || !email) return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });

    const semestreNumero = Number(semestre);
    const semestreValido = semestre === undefined || (Number.isInteger(semestreNumero) && semestreNumero > 0);
    if (!semestreValido) return res.status(400).json({ message: 'Semestre invalido.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) return res.status(400).json({ message: 'Email invalido.' });

    const cursoNormalizado = String(curso).trim();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const alunoAtualResult = await client.query(
        `
          SELECT id, curso, semestre
          FROM alunos
          WHERE id = $1
          FOR UPDATE;
        `,
        [Number(id)],
      );

      const alunoAtual = alunoAtualResult.rows[0];
      if (!alunoAtual) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Aluno nao encontrado.' });
      }

      const { rowCount: cursoRowCount } = await client.query('SELECT 1 FROM cursos WHERE nome = $1', [cursoNormalizado]);
      if (cursoRowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Curso invalido.' });
      }

      const semestreFinal = semestreValido ? semestreNumero : alunoAtual.semestre;

      const query = `
        UPDATE alunos
        SET nome = $1,
            matricula = $2,
            curso = $3,
            email = $4,
            telefone = $5,
            cep = $6,
            endereco = $7,
            cidade = $8,
            estado = $9,
            semestre = $10
        WHERE id = $11
        RETURNING id, nome, matricula, curso, semestre, email, telefone, cep, endereco, cidade, estado;
      `;

      const values = [
        String(nome).trim(),
        String(matricula).trim(),
        cursoNormalizado,
        String(email).trim(),
        telefone ? String(telefone).trim() : null,
        cep ? String(cep).trim() : null,
        endereco ? String(endereco).trim() : null,
        cidade ? String(cidade).trim() : null,
        estado ? String(estado).trim().toUpperCase() : null,
        semestreFinal,
        Number(id),
      ];

      const { rows } = await client.query(query, values);
      const aluno = rows[0];

      if (!aluno) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Aluno nao encontrado.' });
      }

      const cursoOuSemestreMudou = alunoAtual.curso !== aluno.curso || Number(alunoAtual.semestre) !== Number(aluno.semestre);

      if (cursoOuSemestreMudou) {
        const disciplinasResult = await client.query(
          `
            SELECT id
            FROM disciplinas
            WHERE curso = $1
              AND semestre = $2
            ORDER BY nome;
          `,
          [aluno.curso, aluno.semestre],
        );

        const disciplinaIds = disciplinasResult.rows.map((row) => row.id);

        if (disciplinaIds.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: 'Nao ha disciplinas cadastradas para o curso e semestre selecionados.',
          });
        }

        await client.query(
          `
            DELETE FROM notas
            WHERE aluno_id = $1
              AND disciplina_id NOT IN (
                SELECT id FROM disciplinas WHERE curso = $2 AND semestre = $3
              );
          `,
          [aluno.id, aluno.curso, aluno.semestre],
        );

        await client.query('DELETE FROM matriculas WHERE aluno_id = $1', [aluno.id]);

        for (const disciplinaId of disciplinaIds) {
          await client.query('INSERT INTO matriculas (aluno_id, disciplina_id) VALUES ($1, $2)', [aluno.id, disciplinaId]);
        }
      }

      await client.query(
        `UPDATE usuarios SET nome = $1, email = $2 WHERE aluno_id = $3 RETURNING id;`,
        [aluno.nome, aluno.email, aluno.id],
      );

      await client.query('COMMIT');
      return res.json({ message: 'Aluno atualizado com sucesso.', aluno });
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Matricula ou email ja cadastrado.' });
    }
    logServerError(req, 'Erro ao atualizar aluno.', error);
    return res.status(500).json({ message: 'Erro ao atualizar aluno.' });
  }
}

async function deleteAlunoById(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Id do aluno e obrigatorio.' });
    }

    const alunoId = Number(id);
    await client.query('BEGIN');

    const { rowCount } = await client.query('SELECT 1 FROM alunos WHERE id = $1', [alunoId]);
    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Aluno nao encontrado.' });
    }

    await client.query('DELETE FROM usuarios WHERE aluno_id = $1', [alunoId]);
    await client.query('DELETE FROM notas WHERE aluno_id = $1', [alunoId]);
    await client.query('DELETE FROM matriculas WHERE aluno_id = $1', [alunoId]);
    await client.query('DELETE FROM alunos WHERE id = $1', [alunoId]);

    await client.query('COMMIT');
    return res.json({ message: 'Aluno removido com sucesso.' });
  } catch (error) {
    await client.query('ROLLBACK');
    logServerError(req, 'Erro ao remover aluno.', error);
    return res.status(500).json({ message: 'Erro ao remover aluno.' });
  } finally {
    client.release();
  }
}

module.exports = { createAluno, listAlunos, getMyAlunoProfile, updateMyAlunoProfile, updateAlunoById, deleteAlunoById };
