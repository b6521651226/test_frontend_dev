// /backend/routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

/* =========================
   NEW: list categories (ลูกค้าต้องใช้ทำตัวกรอง)
   GET /api/products/categories
   ========================= */
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT category_id, name FROM categories ORDER BY name ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error('[PRODUCTS_GET_CATEGORIES]', e);
    res.status(500).json({ message: 'โหลดหมวดหมู่ล้มเหลว' });
  }
});

/* =========================
   GET ALL PRODUCTS (+ รองรับตัวกรอง category_id)
   - ของเดิม: เคยคืนเฉพาะ products -> ยังใช้ได้เหมือนเดิม
   - เพิ่ม: ?category_id=xx จะกรองตามหมวด
   - เพิ่ม: ส่ง field category_name มาด้วย (ไม่กระทบผู้ใช้เดิม)
   ========================= */
router.get('/', async (req, res) => {
  try {
    const cid = Number(req.query.category_id || 0);

    let sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
    `;
    const params = [];
    if (cid) {
      sql += ' WHERE p.category_id = ?';
      params.push(cid);
    }
    sql += ' ORDER BY p.created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('[PRODUCTS_LIST]', e);
    res.status(500).json({ message: 'โหลดสินค้าล้มเหลว' });
  }
});

// CREATE PRODUCT (เดิม) — รองรับ category_id อยู่แล้ว
router.post('/', async (req, res) => {
    const { product_name, description, price, stock, category_id, image_url } = req.body;
    await db.query(
        'INSERT INTO products (product_name, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [product_name, description, price, stock, category_id || null, image_url]
    );
    res.json({ message: 'Product created' });
});

// UPDATE PRODUCT (เดิม) — รองรับ category_id อยู่แล้ว
router.put('/:id', async (req, res) => {
    const { product_name, description, price, stock, category_id, image_url } = req.body;
    await db.query(
        'UPDATE products SET product_name=?, description=?, price=?, stock=?, category_id=?, image_url=? WHERE product_id=?',
        [product_name, description, price, stock, category_id || null, image_url, req.params.id]
    );
    res.json({ message: 'Product updated' });
});

// DELETE PRODUCT (เดิม)
router.delete('/:id', async (req, res) => {
    await db.query('DELETE FROM products WHERE product_id=?', [req.params.id]);
    res.json({ message: 'Product deleted' });
});

module.exports = router;
