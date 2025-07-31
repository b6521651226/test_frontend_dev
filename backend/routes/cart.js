// backend/routes/cart.js
const express = require('express')
const router = express.Router()
const db = require('../config/db') // สมมุติว่ามี db connection แล้ว

router.post('/', async (req, res) => {
  const { user_id, product_id, quantity, product_option } = req.body
  try {
    await db.query(
      'INSERT INTO cart (user_id, product_id, quantity, product_option) VALUES (?, ?, ?, ?)',
      [user_id, product_id, quantity, product_option]
    )
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.status(500).send('เพิ่มลงตะกร้าล้มเหลว')
  }
})


router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.cart_id,
        c.product_id,
        c.quantity,
        c.product_option,
        p.name,
        p.price,
        p.image_url
      FROM cart c
      JOIN products p ON c.product_id = p.product_id
      ORDER BY c.created_at DESC
    `)

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).send('ดึงข้อมูลตะกร้าล้มเหลว')
  }
})

module.exports = router

