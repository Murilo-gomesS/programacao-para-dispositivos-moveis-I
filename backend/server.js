require('dotenv').config();
const { app } = require('./app');

const port = Number(process.env.PORT || 3333);

function warnUnsafeEnvironment() {
  const jwtSecret = String(process.env.JWT_SECRET || '');
  const dbPassword = String(process.env.DB_PASSWORD || '');
  const adminPasswordHash = String(process.env.ADMIN_PASSWORD_HASH || '');

  if (!jwtSecret) {
    console.error('JWT_SECRET nao configurado. Defina um segredo forte no backend/.env.');
    process.exit(1);
  }

  if (jwtSecret.includes('CHANGE_ME') || jwtSecret.length < 32) {
    console.warn('JWT_SECRET parece fraco ou ainda padrao. Troque por um segredo longo e aleatorio.');
  }

  if (!dbPassword || dbPassword === 'postgres') {
    console.warn('DB_PASSWORD usa um valor padrao/fraco. Troque por uma senha forte antes de publicar ou compartilhar o ambiente.');
  }

  if (!adminPasswordHash || adminPasswordHash.includes('CHANGE_ME')) {
    console.warn('ADMIN_PASSWORD_HASH nao esta configurado. Login de administrador por ambiente pode falhar.');
  }
}

warnUnsafeEnvironment();

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
