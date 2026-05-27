const fs = require('fs');
const path = require('path');

require('dotenv').config();
const { pool } = require('./connection');

function readSql(fileName) {
  const filePath = path.join(__dirname, fileName);
  return fs.readFileSync(filePath, 'utf8');
}

async function waitForDb(maxAttempts = 10, delayMs = 500) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Falha ao conectar no banco.');
}

async function main() {
  try {
    await waitForDb();

    const schemaSql = readSql('schema.sql');
    const seedSql = readSql('seed.sql');

    await pool.query(schemaSql);
    await pool.query(seedSql);

    console.log('DB inicializado com sucesso (schema + seed).');
  } catch (error) {
    console.error('Falha ao inicializar DB:', error && error.message ? error.message : error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
