const express = require('express')
const router = express.Router()
const db = require('../config/db')
const bcrypt = require('bcryptjs')  // ✅ import bcrypt

// ====== ของเดิมทั้งหมดที่มึงมี (ไม่แตะ) ======
// GET all orders (admin)
router.get('/orders', async (req, res) => {
  try {
    const [rows] = await db.query(`
    SELECT 
    o.order_id,
    o.user_id,
    u.name AS username,
    u.address,
    u.phone,
    o.status AS order_status,
    o.total_price,
    o.created_at,
    p.status AS payment_status,
    p.payment_slip_url,
    d.status AS delivery_status,
    d.tracking_number
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    LEFT JOIN deliveries d ON o.order_id = d.order_id
    ORDER BY o.created_at DESC
    `)

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// PATCH update order status + tracking
router.patch('/orders/:id', async (req, res) => {
  const { id } = req.params
  const { status, tracking_number } = req.body

  try {
    await db.query(`UPDATE orders SET status=? WHERE order_id=?`, [status, id])
    const [rows] = await db.query(`SELECT * FROM deliveries WHERE order_id=?`, [id])

    if (rows.length > 0) {
      await db.query(
        `UPDATE deliveries SET tracking_number=?, status=? WHERE order_id=?`,
        [tracking_number, status, id]
      )
    } else {
      const [userData] = await db.query(`
        SELECT u.address, u.phone
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.order_id = ?
      `, [id])

      const address = userData[0]?.address || ''
      const phone   = userData[0]?.phone || ''

      await db.query(
        `INSERT INTO deliveries (order_id, tracking_number, status, address, phone) VALUES (?, ?, ?, ?, ?)`,
        [id, tracking_number, status, address, phone]
      )
    }

    if (status === 'paid') {
      await db.query(`UPDATE payments SET status='paid', paid_at=NOW() WHERE order_id=?`, [id])
    }

    res.json({ message: 'อัปเดตเรียบร้อย' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Update failed' })
  }
})

// GET all users (admin)
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        user_id, 
        name, 
        email, 
        phone, 
        address, 
        role, 
        created_at, 
        updated_at
      FROM users
      ORDER BY user_id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
})


// ====== ✅ เพิ่มใหม่: CREATE user พร้อม bcrypt ======
router.post('/users', async (req, res) => {
  try {
    const { name, email, password = '123456', phone, address, role } = req.body

    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, phone, address, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null, address || null, role || 'customer']
    )

    res.json({ message: 'เพิ่มผู้ใช้สำเร็จ', user_id: result.insertId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'เพิ่มผู้ใช้ล้มเหลว' })
  }
})


// ====== ✅ เพิ่มใหม่: UPDATE user พร้อม bcrypt ======
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, password, phone, address, role } = req.body

    let sql = `UPDATE users SET name=?, email=?, phone=?, address=?, role=?`
    const params = [name, email, phone || null, address || null, role || 'customer']

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      sql += `, password=?`
      params.push(hashedPassword)
    }

    sql += ` WHERE user_id=?`
    params.push(id)

    await db.query(sql, params)
    res.json({ message: 'แก้ไขผู้ใช้สำเร็จ' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'แก้ไขผู้ใช้ล้มเหลว' })
  }
})
// ====== Sales Dashboard Stats (append to the end of admin.js) ======

// สรุปยอดรวมแบบเร็ว: วันนี้ / เดือนนี้ / ยอดรวมทั้งหมด (เฉพาะออเดอร์ที่ชำระแล้ว)
router.get('/stats/summary', async (req, res) => {
  try {
    // ใช้ orders.status ในระบบนี้: จ่ายแล้วถือว่า 'paid' หรือ 'done'
    const paidStatuses = ['paid', 'done'];

    // Today
    const [todayRows] = await db.query(
      `
      SELECT 
        COALESCE(SUM(total_price),0) AS revenue, 
        COUNT(*) AS orders
      FROM orders
      WHERE status IN (?, ?) AND DATE(created_at) = CURDATE()
      `,
      paidStatuses
    );

    // This month
    const [monthRows] = await db.query(
      `
      SELECT 
        COALESCE(SUM(total_price),0) AS revenue, 
        COUNT(*) AS orders
      FROM orders
      WHERE status IN (?, ?) 
        AND YEAR(created_at) = YEAR(CURDATE())
        AND MONTH(created_at) = MONTH(CURDATE())
      `,
      paidStatuses
    );

    // All time
    const [allRows] = await db.query(
      `
      SELECT 
        COALESCE(SUM(total_price),0) AS revenue, 
        COUNT(*) AS orders
      FROM orders
      WHERE status IN (?, ?)
      `,
      paidStatuses
    );

    res.json({
      today: todayRows[0],
      month: monthRows[0],
      all: allRows[0],
    });
  } catch (err) {
    console.error('[STATS_SUMMARY]', err);
    res.status(500).json({ error: 'summary failed' });
  }
});

// ยอดรายวันย้อนหลัง N วัน (default 14 วัน)
router.get('/stats/daily', async (req, res) => {
  const days = Math.max(1, Math.min(Number(req.query.days) || 14, 90)); // กันยิงหนัก
  try {
    const [rows] = await db.query(
      `
      SELECT 
        DATE(created_at) AS day,
        COUNT(*) AS orders,
        COALESCE(SUM(total_price),0) AS revenue
      FROM orders
      WHERE status IN ('paid', 'done', 'shipping') 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      `,
      [days]
    );
    res.json(rows);
  } catch (err) {
    console.error('[STATS_DAILY]', err);
    res.status(500).json({ error: 'daily failed' });
  }
});

// ยอดรายเดือนย้อนหลัง N เดือน (default 6 เดือน)
router.get('/stats/monthly', async (req, res) => {
  const months = Math.max(1, Math.min(Number(req.query.months) || 6, 24));
  try {
    const [rows] = await db.query(
      `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS ym,
        COUNT(*) AS orders,
        COALESCE(SUM(total_price),0) AS revenue
      FROM orders
      WHERE status IN ('paid', 'done')
        AND created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ?-1 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY ym DESC
      `,
      [months]
    );
    res.json(rows);
  } catch (err) {
    console.error('[STATS_MONTHLY]', err);
    res.status(500).json({ error: 'monthly failed' });
  }
});


module.exports = router
