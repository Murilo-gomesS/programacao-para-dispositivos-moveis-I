const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuariosModel = require('../models/usuariosModel');
const { pool } = require('../database/connection');
const { logServerError } = require('../utils/errorUtils');

const defaultUser = {
  email: process.env.ADMIN_EMAIL || 'admin@email.com',
  login: process.env.ADMIN_LOGIN || 'admin',
  passwordHash: process.env.ADMIN_PASSWORD_HASH,
  nome: process.env.ADMIN_NAME || 'Admin',
  perfil: process.env.ADMIN_PROFILE || 'Administrador',
};

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha sao obrigatorios.' });
    }

    const identifier = String(email).trim();
    const senhaValue = String(senha).trim();

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT_SECRET nao configurado.' });
    }

    const usuarioDb = await usuariosModel.findByEmailOrLogin(identifier);

    if (usuarioDb) {
      const ok = await bcrypt.compare(senhaValue, usuarioDb.senha_hash);
      if (!ok) {
        return res.status(401).json({ message: 'Credenciais invalidas.' });
      }

      let matricula = undefined;

      if (usuarioDb.perfil === 'Aluno' && usuarioDb.aluno_id) {
        const { rows } = await pool.query('SELECT matricula FROM alunos WHERE id = $1', [
          usuarioDb.aluno_id,
        ]);
        matricula = rows[0]?.matricula;
      }

      const token = jwt.sign(
        {
          sub: String(usuarioDb.id),
          nome: usuarioDb.nome,
          perfil: usuarioDb.perfil,
          aluno_id: usuarioDb.aluno_id,
          professor_id: usuarioDb.professor_id,
        },
        jwtSecret,
        { expiresIn: '8h' },
      );

      return res.json({
        usuario: {
          nome: usuarioDb.nome,
          perfil: usuarioDb.perfil,
          alunoId: usuarioDb.aluno_id || undefined,
          professorId: usuarioDb.professor_id || undefined,
          matricula,
        },
        token,
      });
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const matchesIdentifier =
      normalizedIdentifier === String(defaultUser.email).trim().toLowerCase() ||
      normalizedIdentifier === String(defaultUser.login).trim().toLowerCase();

    if (!matchesIdentifier) {
      return res.status(401).json({ message: 'Credenciais invalidas.' });
    }

    if (!defaultUser.passwordHash) {
      return res.status(500).json({
        message: 'Login admin por ambiente nao configurado. Defina ADMIN_PASSWORD_HASH.',
      });
    }

    const matchesPassword = await bcrypt.compare(senhaValue, defaultUser.passwordHash);

    if (!matchesPassword) {
      return res.status(401).json({ message: 'Credenciais invalidas.' });
    }

    const token = jwt.sign(
      { sub: 'env-admin', nome: defaultUser.nome, perfil: defaultUser.perfil },
      jwtSecret,
      { expiresIn: '8h' },
    );

    return res.json({
      usuario: { nome: defaultUser.nome, perfil: defaultUser.perfil },
      token,
    });
  } catch (error) {
    logServerError(req, 'Erro ao autenticar usuario.', error);
    return res.status(500).json({ message: 'Erro ao autenticar usuario.' });
  }
}

module.exports = { login };
