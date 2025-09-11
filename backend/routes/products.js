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
    const { product_name, description, price, stock, category_id, image_url } = req.body;
    await db.query(
        'INSERT INTO products (product_name, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [product_name, description, price, stock, category_id, image_url]
    );
    res.json({ message: 'Product created' });
});

// UPDATE PRODUCT
router.put('/:id', async (req, res) => {
    const { product_name, description, price, stock, category_id, image_url } = req.body;
    await db.query(
        'UPDATE products SET product_name=?, description=?, price=?, stock=?, category_id=?, image_url=? WHERE product_id=?',
        [product_name, description, price, stock, category_id, image_url, req.params.id]
    );
    res.json({ message: 'Product updated' });
});

// DELETE PRODUCT
router.delete('/:id', async (req, res) => {
    await db.query('DELETE FROM products WHERE product_id=?', [req.params.id]);
    res.json({ message: 'Product deleted' });
});

module.exports = router;
