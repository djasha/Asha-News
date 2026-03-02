const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('./schema');
const logger = require('../utils/logger');
const supabaseClient = require('./supabaseClient');

const isProduction = process.env.NODE_ENV === 'production';

let db = null;
let pool = null;
let useSupabase = false;

// Check if we should use Supabase REST API instead of direct connection
function shouldUseSupabase() {
  // If DATABASE_URL is not set, use Supabase
  if (!process.env.DATABASE_URL) {
    logger.info('No DATABASE_URL, using Supabase REST API');
    return true;
  }
  return false;
}

function getPool() {
  if (shouldUseSupabase()) {
    useSupabase = true;
    return null;
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      max: isProduction ? 20 : 5,
      idleTimeoutMillis: isProduction ? 30000 : 10000,
      connectionTimeoutMillis: isProduction ? 5000 : 3000,
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected pool error');
    });
  }
  return pool;
}

function getDb() {
  if (shouldUseSupabase()) {
    useSupabase = true;
    return null;
  }

  if (!db) {
    db = drizzle(getPool(), { schema });
  }
  return db;
}

function isUsingSupabase() {
  return useSupabase || shouldUseSupabase();
}

async function testConnection() {
  // Test Supabase REST connection
  if (shouldUseSupabase()) {
    try {
      const { error } = await supabaseClient.select('global_settings', { limit: 1 });
      if (error) {
        logger.error({ error }, 'Supabase REST connection failed');
        return false;
      }
      logger.info('Supabase REST connection successful');
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Supabase REST connection failed');
      return false;
    }
  }

  // Test direct PostgreSQL connection
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    return false;
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

module.exports = { getDb, getPool, testConnection, closePool, isUsingSupabase, supabaseClient };
