const { Router } = require('express');

const authRoutes = require('./authRoutes');
const usuariosRoutes = require('./usuariosRoutes');
const alunosRoutes = require('./alunosRoutes');
const professoresRoutes = require('./professoresRoutes');
const disciplinasRoutes = require('./disciplinasRoutes');
const boletimRoutes = require('./boletimRoutes');
const visualizacaoRoutes = require('./visualizacaoRoutes');

const routes = Router();

routes.use(authRoutes);
routes.use(usuariosRoutes);
routes.use(alunosRoutes);
routes.use(professoresRoutes);
routes.use(disciplinasRoutes);
routes.use(boletimRoutes);
routes.use(visualizacaoRoutes);

module.exports = routes;
