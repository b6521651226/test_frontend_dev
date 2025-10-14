const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload'); // << เพิ่ม

// POST /api/orders
router.post('/', verifyToken, upload.single('slip'), async (req, res) => {
  const uid = req.user.uid;

  let items = [];
  try {
    items = JSON.parse(req.body.items || '[]');
  } catch (e) {
    return res.status(400).json({ message: 'items ต้องเป็น JSON array' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'ตะกร้าว่าง' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ดึงราคาจริงจาก DB
    const ids = items.map(i => i.product_id);
    const [rows] = await conn.query(
      `SELECT product_id, price FROM products WHERE product_id IN (${ids.map(() => '?').join(',')})`,
      ids
    );
    const priceMap = new Map(rows.map(r => [r.product_id, Number(r.price)]));

    let total = 0;
    for (const item of items) {
      const price = priceMap.get(item.product_id);
      if (price == null) throw new Error(`สินค้า id=${item.product_id} ไม่มีอยู่`);
      total += price * Number(item.quantity || 0);
    }

    // insert order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, status, total_price) VALUES (?, ?, ?)',
      [uid, 'pending', total]
    );
    const orderId = orderResult.insertId;

    // insert order_items
    const values = items.map(i => [orderId, i.product_id, i.quantity, priceMap.get(i.product_id)]);
    await conn.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [values]
    );

    // ✅ ตัดสต็อกจาก products
    for (const item of items) {
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?',
        [item.quantity, item.product_id, item.quantity]
      );
    }

    // insert payment (เก็บ slip ที่แนบมาตอนสร้างออเดอร์ ถ้ามี)
    const slipUrl = req.file ? `/uploads/slips/${req.file.filename}` : null;
    await conn.query(
      'INSERT INTO payments (order_id, payment_slip_url, status) VALUES (?, ?, ?)',
      [orderId, slipUrl, 'pending']
    );

    // =============================
    // ✅ สร้าง QR PromptPay + bill_ref สำหรับออเดอร์นี้
    // =============================
    const path = require('path');
    const fs = require('fs');
    const qrcode = require('qrcode');
    const generatePayload = require('promptpay-qr');
    const PROMPTPAY_ID = process.env.PROMPTPAY_ID;

    try {
      // ยอดที่ต้องชำระ
      const amount = Number(total.toFixed(2));

      // ✅ สร้าง bill_ref แบบ unique ต่อออเดอร์ (อ่านง่าย + สั้น)
      // รูปแบบ: ORD-<orderId>-<สุ่ม6ตัว>
      const rand = Math.random().toString(36).slice(-6).toUpperCase();
      const billRef = `ORD-${orderId}-${rand}`;

      // ✅ gen payload: พยายามแนบ ref1 ถ้า lib รองรับ (บางเวอร์ชันอาจไม่รองรับ)
      let payload = '';
      try {
        payload = generatePayload(PROMPTPAY_ID, { amount, ref1: billRef });
      } catch (_e) {
        // fallback ถ้า lib ไม่รองรับ ref1 ก็อย่างน้อยให้มี amount ไปก่อน
        payload = generatePayload(PROMPTPAY_ID, { amount });
      }

      // path ของไฟล์ QR
      const qrRelPath = `/uploads/qr/ord_${orderId}.png`;
      const qrAbsPath = path.join(__dirname, '..', 'public', qrRelPath);

      // ✅ สร้างโฟลเดอร์ public/uploads/qr/ ถ้ายังไม่มี
      const qrDir = path.dirname(qrAbsPath);
      if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

      // ✅ สร้างไฟล์ QR
      await qrcode.toFile(qrAbsPath, payload, { margin: 1, width: 360 });

      // ✅ อัปเดตข้อมูลใน payments: เก็บยอดที่คาดหวัง + payload + รูป QR + bill_ref
      await conn.query(
        `UPDATE payments
           SET amount_expected=?,
               qr_payload=?,
               qr_image_url=?,
               bill_ref=?
         WHERE order_id=?`,
        [amount, payload, qrRelPath, billRef, orderId]
      );

      console.log(`✅ QR พร้อมเพย์ถูกสร้างแล้ว -> ${qrRelPath} (bill_ref=${billRef})`);
    } catch (err) {
      console.error('[QR_ERROR]', err);
    }

    await conn.commit();
    res.status(201).json({ message: 'สร้างออเดอร์แล้ว', orderId, total, slip: slipUrl });
  } catch (err) {
    await conn.rollback();
    console.error('[ORDER_ERROR]', err);
    res.status(500).json({ message: 'ผิดพลาด', detail: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/orders/my
router.get('/my', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  try {
    const [orders] = await pool.query(
      `SELECT o.order_id, o.status, o.total_price, o.created_at, o.updated_at,
              p.payment_slip_url, p.status AS payment_status,
              d.tracking_number         -- ✅ เพิ่ม tracking_number
       FROM orders o
       LEFT JOIN payments p ON o.order_id = p.order_id
       LEFT JOIN deliveries d ON o.order_id = d.order_id   -- ✅ join deliveries
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [uid]
    );

    // ดึง items ของแต่ละ order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.product_id, oi.quantity, oi.price,
                pr.product_name, pr.image_url
         FROM order_items oi
         JOIN products pr ON oi.product_id = pr.product_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    console.error('[ORDER_MY_ERROR]', err);
    res.status(500).json({ message: 'ดึงประวัติคำสั่งซื้อล้มเหลว' });
  }
});

// PATCH /api/orders/:id/cancel  (ลูกค้ายกเลิกออเดอร์ของตัวเอง)
router.patch('/orders/:id/cancel', verifyToken, async (req, res) => {
  const uid = req.user.uid;
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) ตรวจว่าเป็นออเดอร์ของผู้ใช้นี้ และยังอยู่สถานะ pending เท่านั้น
    const [rows] = await conn.query(
      `SELECT order_id, user_id, status 
       FROM orders 
       WHERE order_id=? AND user_id=? 
       FOR UPDATE`,
      [id, uid]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'ไม่พบคำสั่งซื้อ หรือไม่มีสิทธิ์ยกเลิก' });
    }
    if (rows[0].status !== 'pending') {
      await conn.rollback();
      return res.status(400).json({ message: 'คำสั่งซื้อนี้ไม่สามารถยกเลิกได้' });
    }

    // 2) ดึง items มาคืนสต็อก
    const [items] = await conn.query(
      `SELECT product_id, quantity 
       FROM order_items 
       WHERE order_id=?`,
      [id]
    );

    for (const it of items) {
      await conn.query(
        `UPDATE products 
         SET stock = stock + ? 
         WHERE product_id = ?`,
        [it.quantity, it.product_id]
      );
    }

    // 3) อัปเดตสถานะออเดอร์เป็น cancel
    await conn.query(
      `UPDATE orders 
       SET status='cancel', updated_at=NOW() 
       WHERE order_id=?`,
      [id]
    );

    // 4) อัปเดต payment ให้เป็นค่าที่ ENUM รองรับ (หลีกเลี่ยง 'cancelled')
    // ถ้า schema คุณมีค่า 'cancel' ใน ENUM ให้เปลี่ยนบรรทัดด้านล่างเป็น status='cancel'
    await conn.query(
      `UPDATE payments 
       SET status = IF(status='paid','paid','pending') 
       WHERE order_id=?`,
      [id]
    );

    // (ทางเลือก) mark การขนส่งเป็น cancel ถ้ามี record อยู่
    await conn.query(
      `UPDATE deliveries 
       SET status='cancel' 
       WHERE order_id=?`,
      [id]
    );

    await conn.commit();
    return res.json({ message: 'ยกเลิกคำสั่งซื้อเรียบร้อย และคืนสต็อกแล้ว' });
  } catch (err) {
    await conn.rollback();
    console.error('[CANCEL_ORDER_ERROR]', err);
    return res.status(500).json({ message: 'ยกเลิกคำสั่งซื้อล้มเหลว' });
  } finally {
    conn.release();
  }
});



module.exports = router;
