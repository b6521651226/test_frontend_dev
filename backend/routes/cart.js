// backend/routes/cart.js
const express = require('express')
const router = express.Router()
const db = require('../db') // สมมุติว่ามี db connection แล้ว

router.post('/', async (req, res) => {
  const { product_id, quantity, product_option } = req.body
  try {
    await db.query(
      'INSERT INTO cart (product_id, quantity, product_option) VALUES (?, ?, ?)',
      [product_id, quantity, product_option]
    )
    res.sendStatus(200)
  } catch (err) {
    console.error(err)
    res.status(500).send('เพิ่มลงตะกร้าล้มเหลว')
  }
})

module.exports = router

