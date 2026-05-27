INSERT INTO alunos (nome, matricula, curso, email, telefone, cep, endereco, cidade, estado)
VALUES
  ('Ana Souza', '2024001', 'Sistemas de Informacao', 'ana.souza@email.com', '11999990001', '01001000', 'Praca da Se', 'Sao Paulo', 'SP'),
  ('Bruno Lima', '2024002', 'Engenharia de Software', 'bruno.lima@email.com', '11999990002', '20040002', 'Rua da Quitanda', 'Rio de Janeiro', 'RJ')
ON CONFLICT DO NOTHING;

INSERT INTO professores (nome, titulacao, area, tempo_docencia, email)
VALUES
  ('Carla Mendes', 'Mestrado', 'Banco de Dados', 8, 'carla.mendes@email.com'),
  ('Diego Ramos', 'Doutorado', 'Engenharia de Software', 12, 'diego.ramos@email.com')
ON CONFLICT DO NOTHING;

INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
SELECT 'Banco de Dados I', 80, p.id, 'Sistemas de Informacao', 2
FROM professores p
WHERE p.email = 'carla.mendes@email.com'
  AND NOT EXISTS (
    SELECT 1 FROM disciplinas d
    WHERE d.nome = 'Banco de Dados I' AND d.curso = 'Sistemas de Informacao' AND d.semestre = 2
  );

INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
SELECT 'Engenharia de Software I', 80, p.id, 'Engenharia de Software', 3
FROM professores p
WHERE p.email = 'diego.ramos@email.com'
  AND NOT EXISTS (
    SELECT 1 FROM disciplinas d
    WHERE d.nome = 'Engenharia de Software I' AND d.curso = 'Engenharia de Software' AND d.semestre = 3
  );

INSERT INTO disciplinas (nome, carga_horaria, professor_id, curso, semestre)
SELECT 'Programacao Mobile', 60, p.id, 'Engenharia de Software', 4
FROM professores p
WHERE p.email = 'diego.ramos@email.com'
  AND NOT EXISTS (
    SELECT 1 FROM disciplinas d
    WHERE d.nome = 'Programacao Mobile' AND d.curso = 'Engenharia de Software' AND d.semestre = 4
  );

-- Matriculas (vinculo aluno x disciplina), mesmo quando ainda nao existe nota.
INSERT INTO matriculas (aluno_id, disciplina_id)
SELECT a.id, d.id
FROM alunos a
JOIN disciplinas d ON d.nome = 'Banco de Dados I' AND d.curso = 'Sistemas de Informacao' AND d.semestre = 2
WHERE a.matricula = '2024001'
  AND NOT EXISTS (
    SELECT 1 FROM matriculas m WHERE m.aluno_id = a.id AND m.disciplina_id = d.id
  );

INSERT INTO matriculas (aluno_id, disciplina_id)
SELECT a.id, d.id
FROM alunos a
JOIN disciplinas d ON d.nome = 'Programacao Mobile' AND d.curso = 'Engenharia de Software' AND d.semestre = 4
WHERE a.matricula = '2024001'
  AND NOT EXISTS (
    SELECT 1 FROM matriculas m WHERE m.aluno_id = a.id AND m.disciplina_id = d.id
  );

INSERT INTO matriculas (aluno_id, disciplina_id)
SELECT a.id, d.id
FROM alunos a
JOIN disciplinas d ON d.nome = 'Engenharia de Software I' AND d.curso = 'Engenharia de Software' AND d.semestre = 3
WHERE a.matricula = '2024002'
  AND NOT EXISTS (
    SELECT 1 FROM matriculas m WHERE m.aluno_id = a.id AND m.disciplina_id = d.id
  );

-- Exemplo de vinculo sem nota (Bruno matriculado em Programacao Mobile, mas sem notas lancadas).
INSERT INTO matriculas (aluno_id, disciplina_id)
SELECT a.id, d.id
FROM alunos a
JOIN disciplinas d ON d.nome = 'Programacao Mobile' AND d.curso = 'Engenharia de Software' AND d.semestre = 4
WHERE a.matricula = '2024002'
  AND NOT EXISTS (
    SELECT 1 FROM matriculas m WHERE m.aluno_id = a.id AND m.disciplina_id = d.id
  );

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 8.5, 7.0, 7.75, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Banco de Dados I' AND d.curso = 'Sistemas de Informacao' AND d.semestre = 2
WHERE a.matricula = '2024001'
  AND NOT EXISTS (
    SELECT 1 FROM notas n WHERE n.aluno_id = a.id AND n.disciplina_id = d.id
  );

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 9.0, 8.5, 8.75, 'Aprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Programacao Mobile' AND d.curso = 'Engenharia de Software' AND d.semestre = 4
WHERE a.matricula = '2024001'
  AND NOT EXISTS (
    SELECT 1 FROM notas n WHERE n.aluno_id = a.id AND n.disciplina_id = d.id
  );

INSERT INTO notas (aluno_id, disciplina_id, nota1, nota2, media, situacao)
SELECT a.id, d.id, 5.0, 6.0, 5.5, 'Reprovado'
FROM alunos a
JOIN disciplinas d ON d.nome = 'Engenharia de Software I' AND d.curso = 'Engenharia de Software' AND d.semestre = 3
WHERE a.matricula = '2024002'
  AND NOT EXISTS (
    SELECT 1 FROM notas n WHERE n.aluno_id = a.id AND n.disciplina_id = d.id
  );

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
    (SELECT id FROM alunos WHERE matricula = '2024001'),
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
  )
ON CONFLICT DO NOTHING;
