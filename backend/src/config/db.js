import knex from 'knex';
import config from './env.js';

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'saas_db',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  DB_SSL = 'false',
} = process.env;

const db = knex({
  client: 'pg',
  connection: {
    host: DB_HOST,
    port: Number(DB_PORT),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: { min: 0, max: 10 },
  acquireConnectionTimeout: 10000,
});

// Quick helper to get current env for debugging (unused export helps future phases)
export const appEnv = config.env;

export default db;
