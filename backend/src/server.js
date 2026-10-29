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
