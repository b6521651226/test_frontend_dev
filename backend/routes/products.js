// /backend/routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM products');
    res.json(rows);
});

// CREATE PRODUCT
router.post('/', async (req, res) => {
    const { name, description, price, stock, category_id } = req.body;
    await db.query('INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, stock, category_id]);
    res.json({ message: 'Product created' });
});

// UPDATE PRODUCT
router.put('/:id', async (req, res) => {
    const { name, description, price, stock, category_id } = req.body;
    await db.query('UPDATE products SET name=?, description=?, price=?, stock=?, category_id=? WHERE id=?',
        [name, description, price, stock, category_id, req.params.id]);
    res.json({ message: 'Product updated' });
});

// DELETE PRODUCT
router.delete('/:id', async (req, res) => {
    await db.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ message: 'Product deleted' });
});

module.exports = router;
