const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:june62006@localhost:5432/islandbox_db';

const isProduction =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('render.com') ||
  connectionString.includes('supabase') ||
  connectionString.includes('neon.tech') ||
  process.env.DATABASE_SSL === 'true';

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  // connection established
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  getClient: () => pool.connect(),
};

