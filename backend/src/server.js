const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Test PostgreSQL database connectivity on boot
    const dbTest = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    console.log(`[Database Connected] Host: localhost:5432 | DB: ${dbTest.rows[0].db_name} | Server Time: ${dbTest.rows[0].current_time}`);

    // Auto-seed database if products count is below 100 (ensures Render cloud DB gets all 130 products)
    try {
      const pCount = await pool.query('SELECT COUNT(*) FROM products;');
      const currentProducts = parseInt(pCount.rows[0].count, 10);
      console.log(`[Product Catalog Check] Current products in database: ${currentProducts}`);
      if (currentProducts < 100) {
        console.log(`[Auto-Seed] Products count is ${currentProducts} (< 100). Auto-populating all 130 local items...`);
        const { seedDatabase } = require('./database/seed');
        await seedDatabase(false);
        console.log(`[Auto-Seed] Product catalog populated successfully!`);
      }
    } catch (seedErr) {
      console.error('[Auto-Seed Warning] Could not auto-seed database:', seedErr.message);
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` IslandBox Marketplace API Server is RUNNING`);
      console.log(` Port: http://localhost:${PORT}`);
      console.log(` Health: http://localhost:${PORT}/api/health`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal database startup failure:', err);
    process.exit(1);
  }
}

startServer();
