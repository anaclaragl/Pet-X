const db = require('../db');

/**
 * Generates an available username based on the provided name or username.
 * If the username already exists, appends random suffixes until an unused one is found.
 * Does NOT persist in the database, only returns the available string.
 *
 * @param {string} name 
 * @returns {Promise<string>} Available username
 */
async function username_generator(name) {
  if (!name || typeof name !== 'string') {
    name = 'user';
  }

  // Remove acentuações, espaços e caracteres especiais mantendo padrão limpo
  const cleanName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_.]/g, '');

  const baseUsername = cleanName.startsWith('@') 
    ? `@${cleanName.slice(1)}` 
    : `@${cleanName || 'user'}`;

  let candidate = baseUsername;
  let isAvailable = false;

  // Verifica disponibilidade e sugere novo username caso já exista
  while (!isAvailable) {
    const existing = await db.query('SELECT id FROM profiles WHERE username = $1', [candidate]);
    if (!existing || existing.rows.length === 0) {
      isAvailable = true;
    } else {
      // Sugere novo username com sufixo randômico (0-999)
      const randomSuffix = Math.floor(Math.random() * 1000);
      candidate = `${baseUsername}_${randomSuffix}`;
    }
  }

  return candidate;
}

module.exports = {
  username_generator,
};