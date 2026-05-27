const bcrypt = require('bcryptjs');
const usuariosModel = require('../models/usuariosModel');
const { logServerError } = require('../utils/errorUtils');

async function createUsuario(req, res) {
  try {
    const { email, login, senha, nome, perfil, aluno_id, professor_id } = req.body;

    if (!email || !senha || !nome || !perfil) {
      return res.status(400).json({ message: 'Campos obrigatorios ausentes.' });
    }

    const normalizedPerfil = String(perfil).trim();
    if (!['Aluno', 'Professor', 'Administrador'].includes(normalizedPerfil)) {
      return res.status(400).json({ message: 'Perfil invalido.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email))) {
      return res.status(400).json({ message: 'Email invalido.' });
    }

    const senhaValue = String(senha);
    if (senhaValue.trim().length < 4) {
      return res.status(400).json({ message: 'Senha muito curta.' });
    }

    if (normalizedPerfil === 'Aluno' && !aluno_id) {
      return res.status(400).json({ message: 'aluno_id e obrigatorio para perfil Aluno.' });
    }

    if (normalizedPerfil === 'Professor' && !professor_id) {
      return res.status(400).json({ message: 'professor_id e obrigatorio para perfil Professor.' });
    }

    if (normalizedPerfil === 'Administrador' && (aluno_id || professor_id)) {
      return res
        .status(400)
        .json({ message: 'Administrador nao deve ter aluno_id ou professor_id.' });
    }

    const senha_hash = await bcrypt.hash(senhaValue, 10);

    const usuario = await usuariosModel.create({
      email,
      login,
      senha_hash,
      nome,
      perfil: normalizedPerfil,
      aluno_id,
      professor_id,
    });

    return res.status(201).json({ message: 'Usuario criado com sucesso.', usuario });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'Email ou login ja cadastrado.' });
    }

    if (error && error.code === '23503') {
      return res.status(400).json({ message: 'Vinculo invalido (aluno_id/professor_id).' });
    }

    if (error && error.code === '23514') {
      return res.status(400).json({ message: 'Regras de perfil/vinculo invalidas.' });
    }
    logServerError(req, 'Erro ao criar usuario.', error);
    return res.status(500).json({ message: 'Erro ao criar usuario.' });
  }
}

module.exports = { createUsuario };
