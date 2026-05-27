CREATE TABLE IF NOT EXISTS alunos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  matricula VARCHAR(30) NOT NULL UNIQUE,
  curso VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  cep VARCHAR(10),
  endereco VARCHAR(160),
  cidade VARCHAR(80),
  estado VARCHAR(2)
);

CREATE TABLE IF NOT EXISTS professores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  titulacao VARCHAR(80) NOT NULL,
  area VARCHAR(120) NOT NULL,
  tempo_docencia INTEGER NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  login VARCHAR(60) UNIQUE,
  senha_hash VARCHAR(120) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  perfil VARCHAR(20) NOT NULL,
  aluno_id INTEGER REFERENCES alunos(id) ON UPDATE CASCADE ON DELETE SET NULL,
  professor_id INTEGER REFERENCES professores(id) ON UPDATE CASCADE ON DELETE SET NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_usuarios_perfil CHECK (perfil IN ('Aluno', 'Professor', 'Administrador')),
  CONSTRAINT ck_usuarios_vinculo CHECK (
    (perfil = 'Aluno' AND aluno_id IS NOT NULL AND professor_id IS NULL) OR
    (perfil = 'Professor' AND professor_id IS NOT NULL AND aluno_id IS NULL) OR
    (perfil = 'Administrador' AND aluno_id IS NULL AND professor_id IS NULL)
  )
);

CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_usuarios_atualizado_em') THEN
    CREATE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION set_atualizado_em();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS disciplinas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  carga_horaria INTEGER NOT NULL,
  professor_id INTEGER NOT NULL REFERENCES professores(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  curso VARCHAR(120) NOT NULL,
  semestre INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS matriculas (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_matriculas_aluno_disciplina') THEN
    ALTER TABLE matriculas
      ADD CONSTRAINT uq_matriculas_aluno_disciplina UNIQUE (aluno_id, disciplina_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matriculas_aluno_id ON matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_disciplina_id ON matriculas(disciplina_id);

CREATE TABLE IF NOT EXISTS notas (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id) ON UPDATE CASCADE ON DELETE CASCADE,
  nota1 NUMERIC(4,2) NOT NULL,
  nota2 NUMERIC(4,2) NOT NULL,
  media NUMERIC(4,2) NOT NULL,
  situacao VARCHAR(20) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_notas_aluno_disciplina') THEN
    ALTER TABLE notas
      ADD CONSTRAINT uq_notas_aluno_disciplina UNIQUE (aluno_id, disciplina_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_notas_nota1') THEN
    ALTER TABLE notas
      ADD CONSTRAINT ck_notas_nota1 CHECK (nota1 >= 0 AND nota1 <= 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_notas_nota2') THEN
    ALTER TABLE notas
      ADD CONSTRAINT ck_notas_nota2 CHECK (nota2 >= 0 AND nota2 <= 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_notas_media') THEN
    ALTER TABLE notas
      ADD CONSTRAINT ck_notas_media CHECK (media >= 0 AND media <= 10);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_notas_situacao') THEN
    ALTER TABLE notas
      ADD CONSTRAINT ck_notas_situacao CHECK (situacao IN ('Aprovado', 'Reprovado'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notas_aluno_id ON notas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_notas_disciplina_id ON notas(disciplina_id);
