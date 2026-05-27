jest.mock('../database/connection', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection');

describe('API', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
  });

  test('GET /health retorna ok e request id', async () => {
    const { app } = require('../app');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  test('GET /api/professores sem token retorna 401', async () => {
    const { app } = require('../app');

    const res = await request(app).get('/api/professores');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Token ausente.' });
  });

  test('GET /api/professores com token retorna lista', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const token = jwt.sign({ perfil: 'Aluno' }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .get('/api/professores')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ professores: [] });
  });

  test('GET /api/alunos com token de aluno retorna 403', async () => {
    const token = jwt.sign({ perfil: 'Aluno' }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app).get('/api/alunos').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado.' });
  });

  test('GET /api/alunos com token admin retorna lista', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const token = jwt.sign({ perfil: 'Administrador' }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app).get('/api/alunos').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ alunos: [] });
  });

  test('GET /api/disciplinas com token admin retorna lista', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const token = jwt.sign({ perfil: 'Administrador' }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .get('/api/disciplinas')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ disciplinas: [] });
  });

  test('GET /api/notas com token admin retorna lista', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const token = jwt.sign({ perfil: 'Administrador' }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app).get('/api/notas').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ notas: [] });
  });

  test('GET /api/boletim/:matricula com token professor sem vinculo retorna 403', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const token = jwt.sign({ perfil: 'Professor', professor_id: 10 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .get('/api/boletim/2024001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado.' });
  });

  test('GET /api/boletim/:matricula com token professor com vinculo retorna boletim', async () => {
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            aluno: 'Ana Souza',
            disciplina: 'Banco de Dados I',
            nota1: 8.5,
            nota2: 7,
          },
        ],
      });

    const token = jwt.sign({ perfil: 'Professor', professor_id: 10 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .get('/api/boletim/2024001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      aluno: 'Ana Souza',
      disciplinas: [
        {
          nome: 'Banco de Dados I',
          nota1: 8.5,
          nota2: 7,
          media: 7.75,
          situacao: 'Aprovado',
        },
      ],
    });
  });

  test('GET /api/boletim/:matricula com token aluno de outra matricula retorna 403', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ matricula: '2024001' }] });

    const token = jwt.sign({ perfil: 'Aluno', aluno_id: 1 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .get('/api/boletim/2024999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado.' });
  });

  test('GET /api/visao/aluno com token professor retorna 403', async () => {
    const token = jwt.sign({ perfil: 'Professor', professor_id: 10 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app).get('/api/visao/aluno').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado.' });
  });

  test('GET /api/visao/professor com token aluno retorna 403', async () => {
    const token = jwt.sign({ perfil: 'Aluno', aluno_id: 1 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .get('/api/visao/professor')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado.' });
  });

  test('GET /api/visao/aluno com token aluno retorna disciplinas com professor', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, nome: 'Ana Souza', matricula: '2024001' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            disciplina_id: 2,
            disciplina_nome: 'Banco de Dados I',
            disciplina_curso: 'ADS',
            disciplina_semestre: 1,
            professor_id: 10,
            professor_nome: 'Carlos Silva',
            nota1: null,
            nota2: null,
            media: null,
            situacao: null,
          },
        ],
      });

    const token = jwt.sign({ perfil: 'Aluno', aluno_id: 1 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app).get('/api/visao/aluno').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      aluno: { id: 1, nome: 'Ana Souza', matricula: '2024001' },
      disciplinas: [
        {
          id: 2,
          nome: 'Banco de Dados I',
          curso: 'ADS',
          semestre: 1,
          professor: { id: 10, nome: 'Carlos Silva' },
          nota1: null,
          nota2: null,
          media: null,
          situacao: null,
        },
      ],
    });
  });

  test('PUT /api/notas com token professor atualiza nota da propria disciplina', async () => {
    pool.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 99,
            aluno_id: 1,
            disciplina_id: 2,
            nota1: 9,
            nota2: 8,
            media: 8.5,
            situacao: 'Aprovado',
          },
        ],
      });

    const token = jwt.sign({ perfil: 'Professor', professor_id: 10 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .put('/api/notas')
      .set('Authorization', `Bearer ${token}`)
      .send({ alunoId: 1, disciplinaId: 2, nota1: 9, nota2: 8 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      nota: {
        id: 99,
        aluno_id: 1,
        disciplina_id: 2,
        nota1: 9,
        nota2: 8,
        media: 8.5,
        situacao: 'Aprovado',
      },
    });
  });

  test('PUT /api/notas com token professor sem vinculo retorna 403', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const token = jwt.sign({ perfil: 'Professor', professor_id: 10 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .put('/api/notas')
      .set('Authorization', `Bearer ${token}`)
      .send({ alunoId: 1, disciplinaId: 999, nota1: 9, nota2: 8 });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Acesso negado.' });
  });

  test('PUT /api/alunos/me com token aluno atualiza seus dados', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Ana Atualizada',
            matricula: '2024001',
            curso: 'Sistemas de Informacao',
            email: 'ana.nova@email.com',
            telefone: '11999990001',
            cep: '01001000',
            endereco: 'Rua Nova',
            cidade: 'Sao Paulo',
            estado: 'SP',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            email: 'ana.nova@email.com',
            login: 'ana',
            nome: 'Ana Atualizada',
            perfil: 'Aluno',
            aluno_id: 1,
            professor_id: null,
          },
        ],
      });

    const token = jwt.sign({ perfil: 'Aluno', aluno_id: 1 }, process.env.JWT_SECRET);
    const { app } = require('../app');

    const res = await request(app)
      .put('/api/alunos/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Ana Atualizada',
        email: 'ana.nova@email.com',
        telefone: '11999990001',
        cep: '01001000',
        endereco: 'Rua Nova',
        cidade: 'Sao Paulo',
        estado: 'SP',
      });

    expect(res.status).toBe(200);
    expect(res.body.aluno.nome).toBe('Ana Atualizada');
    expect(res.body.usuario.nome).toBe('Ana Atualizada');
  });
});
