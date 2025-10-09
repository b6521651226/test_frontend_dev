const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: 8830,
  user: 'root',
  password: 'root',
  database: 'npps',
  waitForConnections: true,
  connectionLimit: 10
});
(async () => { try { const conn = await pool.getConnection(); await conn.query("SET time_zone = '+07:00'"); conn.release(); console.log('MySQL time_zone set to +07:00 (Asia/Bangkok)'); } catch (e) { console.warn('WARN: cannot set MySQL time_zone:', e.message); } })();

module.exports = pool;
