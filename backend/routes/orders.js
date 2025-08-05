const express = require('express');
const router = express.Router();
const db = require('../config/db'); // mysql2/promise pool
const { verifyToken } = require('../middlewares/auth');

// POST /api/orders
router.post('/', verifyToken, async (req, res) => {
  const uid = req.user.uid;           // ✅ จาก token
  const { cart = [] } = req.body;

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ message: 'ตะกร้าว่าง' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ดึงราคาปัจจุบันจาก DB กันลูกค้าปรับราคาเอง
    const ids = cart.map(i => i.id);
    const [rows] = await conn.query(
      `SELECT product_id, price FROM products WHERE product_id IN (${ids.map(()=>'?').join(',')})`,
      ids
    );
    const priceMap = new Map(rows.map(r => [r.product_id, Number(r.price)]));

    // คำนวณยอดรวมจากราคาใน DB
    let total = 0;
    for (const item of cart) {
      const price = priceMap.get(item.id);
      if (price == null) {
        throw new Error(`สินค้า id=${item.id} ไม่มีอยู่`);
      }
      total += price * Number(item.qty || 0);
    }

    // สร้างออเดอร์
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, status, total_price) VALUES (?, ?, ?)',
      [uid, 'pending', total]
    );
    const orderId = orderResult.insertId;

    // เพิ่มรายการออเดอร์ (ใช้ราคาจาก DB)
    const values = cart.map(i => [orderId, i.id, i.qty, priceMap.get(i.id)]);
    await conn.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [values]
    );

    await conn.commit();
    res.status(201).json({ message: 'สร้างออเดอร์แล้ว', orderId, total });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'ผิดพลาด', detail: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
