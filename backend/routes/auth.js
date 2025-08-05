const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 8830,        // ✅ ตาม docker-compose (8830:3306)
  user: 'root',
  password: 'root',
  database: 'npps',  // ✅ ใช้ npps ให้ตรงกับที่เห็นใน phpMyAdmin
});

const JWT_SECRET = 'dev-secret';

router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim();
    const password = (req.body.password || '').trim();

    // 1) ดูว่า body เข้ามาถูกไหม
    console.log('LOGIN body:', { email, passwordLen: password.length });

    // 2) query ดูว่าดึงได้กี่แถว
    const [rows] = await pool.query(
      'SELECT user_id, email, password, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    console.log('DB rows:', rows);

    if (rows.length === 0) return res.status(401).json({ message: 'ไม่พบผู้ใช้' });

    const user = rows[0];

    // 3) เทียบรหัสผ่านและ log ผล
    const ok = await bcrypt.compare(password, user.password);
    console.log('bcrypt.compare ->', ok);

    if (!ok) return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

    const token = jwt.sign({ uid: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user_id: user.user_id, role: user.role });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ message: 'server error' });
  }
});

module.exports = router;
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'กรอกข้อมูลไม่ครบ' });
    }

    const [dup] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (dup.length > 0) {
      return res.status(409).json({ message: 'อีเมลนี้มีผู้ใช้แล้ว' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "customer")',
      [name, email, hash]
    );

    res.status(201).json({ message: 'สมัครสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});