// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middlewares/auth'); // ✅ ใช้ JWT

// ใช้กับทุก endpoint ในไฟล์นี้
router.use(verifyToken);

/**
 * POST /api/cart
 * body: { product_id, quantity?, product_option? }
 * - ถ้าในตะกร้ามีสินค้ารายการเดิม (product_id + option เดิม) อยู่แล้ว => บวกจำนวนเพิ่ม
 * - ถ้าไม่มี => insert ใหม่
 */
router.post('/', async (req, res) => {
  const uid = req.user.uid;
  let { product_id, quantity = 1, product_option = null } = req.body;

  quantity = Math.max(1, Number(quantity) || 1);

  try {
    // หา item เดิมในตะกร้าก่อน (ใช้ NULL-safe operator <=>)
    const [found] = await db.query(
      `SELECT cart_id, quantity
       FROM cart
       WHERE user_id = ? AND product_id = ? AND product_option <=> ?`,
      [uid, product_id, product_option]
    );

    if (found.length) {
      // มีอยู่แล้ว -> บวกจำนวน
      const row = found[0];
      await db.query(
        'UPDATE cart SET quantity = ? WHERE cart_id = ? AND user_id = ?',
        [Number(row.quantity) + quantity, row.cart_id, uid]
      );
      return res.status(200).json({ message: 'อัปเดตจำนวนแล้ว', cart_id: row.cart_id });
    } else {
      // ยังไม่มี -> แทรกใหม่
      const [ins] = await db.query(
        'INSERT INTO cart (user_id, product_id, quantity, product_option) VALUES (?, ?, ?, ?)',
        [uid, product_id, quantity, product_option]
      );
      return res.status(201).json({ message: 'เพิ่มลงตะกร้าแล้ว', cart_id: ins.insertId });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เพิ่มลงตะกร้าล้มเหลว' });
  }
});

/**
 * GET /api/cart
 * คืนตะกร้าของ user ปัจจุบันเท่านั้น
 * NOTE: alias ฟิลด์ให้ frontend ใช้งานง่าย: id, name, price, quantity, product_option, image_url
 */
router.get('/', async (req, res) => {
  const uid = req.user.uid;
  try {
    const [rows] = await db.query(
      `SELECT 
         c.cart_id AS id,
         c.product_id,
         c.quantity,
         c.product_option,
         p.product_name AS name,
         p.price,
         p.image_url
       FROM cart c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [uid]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'ดึงข้อมูลตะกร้าล้มเหลว' });
  }
});

/**
 * PATCH /api/cart/:id
 * body: { quantity?, product_option? }
 * - อัปเดตเฉพาะของ user ปัจจุบัน
 */
router.patch('/:id', async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;
  const { quantity, product_option } = req.body;

  const fields = [];
  const values = [];

  if (quantity != null) {
    const q = Math.max(1, Number(quantity) || 1);
    fields.push('quantity = ?');
    values.push(q);
  }
  if (product_option != null) {
    fields.push('product_option = ?');
    values.push(product_option);
  }

  if (!fields.length) {
    return res.status(400).json({ message: 'ไม่มีข้อมูลอัปเดต' });
  }

  try {
    values.push(id, uid);
    const [result] = await db.query(
      `UPDATE cart SET ${fields.join(', ')} WHERE cart_id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการในตะกร้าของคุณ' });
    }

    res.json({ message: 'อัปเดตรายการแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'อัปเดตตะกร้าล้มเหลว' });
  }
});

/**
 * DELETE /api/cart/:id
 * - ลบเฉพาะรายการของ user ปัจจุบัน
 */
router.delete('/:id', async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM cart WHERE cart_id = ? AND user_id = ?',
      [id, uid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบรายการในตะกร้าของคุณ' });
    }

    res.json({ message: 'ลบรายการแล้ว' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'ลบรายการล้มเหลว' });
  }
});

module.exports = router;
