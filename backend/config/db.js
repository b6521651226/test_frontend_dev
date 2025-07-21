const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    port: 8830,
    user: 'root',
    password: 'root',
    database: 'npps'
});

module.exports = pool;
