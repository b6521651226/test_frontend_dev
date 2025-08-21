const express = require('express')
const router = express.Router()
const db = require('../config/db')

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
    // update orders
    await db.query(`UPDATE orders SET status=? WHERE order_id=?`, [status, id])

    // update or insert deliveries
    const [rows] = await db.query(`SELECT * FROM deliveries WHERE order_id=?`, [id])
    if (rows.length > 0) {
      await db.query(
        `UPDATE deliveries SET tracking_number=?, status=? WHERE order_id=?`,
        [tracking_number, status, id]
      )
    } else {
      // 👉 ดึง address + phone จาก users
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

    // auto update payment status ถ้าเป็น paid
    if (status === 'paid') {
      await db.query(`UPDATE payments SET status='paid', paid_at=NOW() WHERE order_id=?`, [id])
    }

    res.json({ message: 'อัปเดตเรียบร้อย' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Update failed' })
  }
})

module.exports = router
