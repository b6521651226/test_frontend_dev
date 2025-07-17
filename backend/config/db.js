// /backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'db', // docker-compose service name ของ mysql
    user: 'root',
    password: 'rootpassword',
    database: 'webdb'
});

module.exports = pool;
