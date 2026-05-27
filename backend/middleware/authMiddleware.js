const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'Token ausente.' });
  }

  const [scheme, token] = authHeader.trim().split(/\s+/);

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token ausente.' });
  }

  if (!token) {
    return res.status(401).json({ message: 'Token ausente.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.perfil !== 'Administrador') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  return next();
}

function requireProfessor(req, res, next) {
  if (req.user?.perfil !== 'Professor' || !req.user?.professor_id) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  return next();
}

function requireAluno(req, res, next) {
  if (req.user?.perfil !== 'Aluno' || !req.user?.aluno_id) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  return next();
}

module.exports = { authMiddleware, requireAdmin, requireProfessor, requireAluno };
