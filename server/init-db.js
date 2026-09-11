const fs = require('fs');
const path = require('path');
const db = require('./db');

async function initDatabase() {
  try {
    console.log('Inicializando o banco de dados PostgreSQL...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSql);
    
    // Migrações adicionais não destrutivas
    await db.query(`
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100) DEFAULT '';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT NULL;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT NULL;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_exact_location BOOLEAN DEFAULT FALSE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

      ALTER TABLE posts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT NULL;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT NULL;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT '';
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT '';
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100) DEFAULT '';
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_approximate BOOLEAN DEFAULT FALSE;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE;
    `);

    console.log('✅ Banco de dados PostgreSQL inicializado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados PostgreSQL:', error);
    process.exit(1);
  }
}

initDatabase();
