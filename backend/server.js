require('dotenv').config();
const { app } = require('./app');

const port = Number(process.env.PORT || 3333);
const server = app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(
      `Erro: porta ${port} ja esta em uso. Feche o terminal que esta rodando o backend ou finalize o processo e tente novamente.`,
    );
    process.exit(1);
  }

  console.error('Erro ao iniciar o servidor:', error);
  process.exit(1);
});
