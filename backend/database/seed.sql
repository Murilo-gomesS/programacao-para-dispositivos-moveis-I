TRUNCATE TABLE notas, matriculas, usuarios, disciplinas, alunos, professores, cursos RESTART IDENTITY CASCADE;

INSERT INTO cursos (nome)
VALUES
  ('Desenvolvimento de Software'),
  ('Geoprocessamento');

INSERT INTO professores (nome, titulacao, area, tempo_docencia, email)
VALUES
  ('Carla Mendes', 'Mestra', 'Desenvolvimento de Software', 8, 'carla.mendes@email.com'),
  ('Diego Ramos', 'Doutor', 'Geoprocessamento', 10, 'diego.ramos@email.com'),
  ('Helena Silva', 'Mestra', 'Tecnologias Aplicadas', 12, 'helena.silva@email.com');

INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado, semestre)
VALUES
  ('Ana Souza', '2026001', 'Desenvolvimento de Software', 'ana.souza@email.com', '11999990001', '01001000', 'Praca da Se', 'Sao Paulo', 'SP', 1),
  ('Bruno Lima', '2026002', 'Desenvolvimento de Software', 'bruno.lima@email.com', '11999990002', '20040002', 'Rua da Quitanda', 'Rio de Janeiro', 'RJ', 1),
  ('Camila Rocha', '2026003', 'Desenvolvimento de Software', 'camila.rocha@email.com', '11999990003', '30140071', 'Av. Afonso Pena', 'Belo Horizonte', 'MG', 1),
  ('Diego Alves', '2026004', 'Geoprocessamento', 'diego.alves@email.com', '11999990004', '70040900', 'SBS', 'Brasilia', 'DF', 1),
  ('Eduarda Nunes', '2026005', 'Geoprocessamento', 'eduarda.nunes@email.com', '11999990005', '80010000', 'Rua XV de Novembro', 'Curitiba', 'PR', 1),
  ('Felipe Costa', '2026006', 'Geoprocessamento', 'felipe.costa@email.com', '11999990006', '50030900', 'Av. Guararapes', 'Recife', 'PE', 1);

INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
SELECT 'Programacao Orientada a Objetos', 80, p.id, 'Desenvolvimento de Software', 1
FROM professores p
WHERE p.email = 'carla.mendes@email.com';

INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
SELECT 'Engenharia de Requisitos', 80, p.id, 'Desenvolvimento de Software', 1
FROM professores p
WHERE p.email = 'helena.silva@email.com';

INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
SELECT 'Cartografia Digital', 80, p.id, 'Geoprocessamento', 1
FROM professores p
WHERE p.email = 'diego.ramos@email.com';

INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
SELECT 'Sensoriamento Remoto', 80, p.id, 'Geoprocessamento', 1
FROM professores p
WHERE p.email = 'helena.silva@email.com';

-- Matriculas automáticas: cada aluno em todas as disciplinas do proprio curso no primeiro semestre.
INSERT INTO matriculas (aluno_id, disciplina_id)
SELECT a.id, d.id
FROM alunos a
JOIN disciplinas d ON d.curso = a.curso AND d.semestre = a.semestre
ON CONFLICT DO NOTHING;

-- Notas alinhadas ao curso e semestre dos alunos.
INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 8.5, 7.5, 8.0, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Programacao Orientada a Objetos'
WHERE a.matricula = '2026001';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 4.0, 5.0, 4.5, 'Reprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Engenharia de Requisitos'
WHERE a.matricula = '2026001';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 7.0, 7.5, 7.25, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Programacao Orientada a Objetos'
WHERE a.matricula = '2026002';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 6.0, 6.5, 6.25, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Engenharia de Requisitos'
WHERE a.matricula = '2026002';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 9.0, 8.0, 8.5, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Programacao Orientada a Objetos'
WHERE a.matricula = '2026003';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 7.5, 8.0, 7.75, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Engenharia de Requisitos'
WHERE a.matricula = '2026003';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 8.0, 8.5, 8.25, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Cartografia Digital'
WHERE a.matricula = '2026004';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 7.0, 7.5, 7.25, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Sensoriamento Remoto'
WHERE a.matricula = '2026004';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 6.5, 7.0, 6.75, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Cartografia Digital'
WHERE a.matricula = '2026005';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 8.0, 8.0, 8.0, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Sensoriamento Remoto'
WHERE a.matricula = '2026005';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 5.5, 6.0, 5.75, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Cartografia Digital'
WHERE a.matricula = '2026006';

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 4.5, 5.0, 4.75, 'Reprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Sensoriamento Remoto'
WHERE a.matricula = '2026006';

-- Usuarios para login via banco (senha: 123)
-- Hash bcrypt (custo 10) gerado em ambiente de dev.
INSERT INTO usuarios (email, login, senha_hash, nome, perfil, aluno_id, professor_id)
VALUES
  ('admin@email.com', 'admin', '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2', 'Admin', 'Administrador', NULL, NULL),
  (
    'ana.souza@email.com',
    'ana',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Ana Souza',
    'Aluno',
    (SELECT id FROM alunos WHERE matricula = '2026001'),
    NULL
  ),
  (
    'bruno.lima@email.com',
    'bruno',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Bruno Lima',
    'Aluno',
    (SELECT id FROM alunos WHERE matricula = '2026002'),
    NULL
  ),
  (
    'camila.rocha@email.com',
    'camila',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Camila Rocha',
    'Aluno',
    (SELECT id FROM alunos WHERE matricula = '2026003'),
    NULL
  ),
  (
    'diego.alves@email.com',
    'diegoa',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Diego Alves',
    'Aluno',
    (SELECT id FROM alunos WHERE matricula = '2026004'),
    NULL
  ),
  (
    'eduarda.nunes@email.com',
    'eduarda',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Eduarda Nunes',
    'Aluno',
    (SELECT id FROM alunos WHERE matricula = '2026005'),
    NULL
  ),
  (
    'felipe.costa@email.com',
    'felipe',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Felipe Costa',
    'Aluno',
    (SELECT id FROM alunos WHERE matricula = '2026006'),
    NULL
  ),
  (
    'carla.mendes@email.com',
    'carla',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Carla Mendes',
    'Professor',
    NULL,
    (SELECT id FROM professores WHERE email = 'carla.mendes@email.com')
  ),
  (
    'diego.ramos@email.com',
    'diegor',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Diego Ramos',
    'Professor',
    NULL,
    (SELECT id FROM professores WHERE email = 'diego.ramos@email.com')
  ),
  (
    'helena.silva@email.com',
    'helena',
    '$2a$10$TWGEzny/3iklp786OqCM8.aJPr0JTLcCXcav5tWS4.rrKbvjz45X2',
    'Helena Silva',
    'Professor',
    NULL,
    (SELECT id FROM professores WHERE email = 'helena.silva@email.com')
  )
ON CONFLICT DO NOTHING;
