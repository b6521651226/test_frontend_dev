const express = require('express')
const router = express.Router()
const db = require('../config/db')

// POST /api/orders
router.post('/', async (req, res) => {
    try {
        const { user_id, cart, total } = req.body
        const [orderResult] = await db.query(
            'INSERT INTO orders (user_id, status, total_price) VALUES (?, ?, ?)',
            [user_id, 'pending', total]
        )
        const orderId = orderResult.insertId

        for (const item of cart) {
            await db.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.id, item.qty, item.price]
            )
        }

        res.status(201).json({ message: 'สร้างออเดอร์แล้ว', orderId })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'ผิดพลาด' })
    }
})

module.exports = router
