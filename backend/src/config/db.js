// src/config/db.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

// 1. Create a native PostgreSQL connection pool
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 2. Initialize the Prisma 7 Driver Adapter wrapping the pool
const adapter = new PrismaPg(pool);

// 3. Inject the adapter directly into the Prisma Client constructor
const prisma = new PrismaClient({
  adapter: adapter,
  log: ['error', 'warn'],
});

module.exports = prisma;