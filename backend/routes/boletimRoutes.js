const { Router } = require('express');
const { getBoletimByMatricula, listNotas, upsertNotaProfessor, upsertNotaAdmin } = require('../controllers/boletimController');
const { authMiddleware, requireAdmin, requireProfessor } = require('../middleware/authMiddleware');

const routes = Router();

routes.get('/boletim/:matricula', authMiddleware, getBoletimByMatricula);
routes.get('/notas', authMiddleware, requireAdmin, listNotas);
routes.put('/notas', authMiddleware, requireProfessor, upsertNotaProfessor);
// Admin can upsert any nota
routes.put('/notas/admin', authMiddleware, requireAdmin, upsertNotaAdmin);

module.exports = routes;
