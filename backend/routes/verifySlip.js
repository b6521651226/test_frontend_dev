// backend/routes/verifySlip.js
const express = require('express');
const router = express.Router();
const path = require('path');
const QrReader = require('qrcode-reader');
const pool = require('../config/db');
const upload = require('../middlewares/upload');   // เก็บไว้ที่ /uploads/slips
const { verifyToken } = require('../middlewares/auth');

/**
 * ถอด QR จากไฟล์ภาพ (ทำสองรอบ + รองรับ jimp หลายเวอร์ชัน)
 */
async function decodeQR(absPath) {
  // import แบบ dynamic จะได้ไม่ชนเวอร์ชัน export
  const { default: Jimp } = await import('jimp');

  const readImage = async (p) => Jimp.read(p);

  const tryDecode = (img) =>
    new Promise((resolve, reject) => {
      const qr = new QrReader();
      qr.callback = (err, v) => (err ? reject(err) : resolve(v ? v.result : null));
      qr.decode(img.bitmap);
    });

  // -------- Pass 1: resize + greyscale + contrast --------
  let img1 = await readImage(absPath);
  try {
    const W = img1.bitmap.width;
    const H = img1.bitmap.height;
    const maxW = 1200, maxH = 1200;
    let tw = W, th = H;

    if (W > maxW || H > maxH) {
      const k = Math.min(maxW / W, maxH / H);
      tw = Math.round(W * k);
      th = Math.round(H * k);
    }
    // Jimp v0.22+ ใช้ object { w:, h: }
    img1 = img1.resize({ w: tw, h: th });

    // method บางเวอร์ชันชื่อ greyscale()
    if (typeof img1.greyscale === 'function') img1.greyscale();
    else if (typeof img1.grayscale === 'function') img1.grayscale();

    if (typeof img1.contrast === 'function') img1.contrast(0.5);
    if (typeof img1.normalize === 'function') img1.normalize();
  } catch (e) {
    console.warn('[QR_PREPROCESS_WARN:P1]', e);
  }

  try {
    const r1 = await tryDecode(img1);
    if (r1) return r1;
  } catch (e) {
    // เงียบไว้ แล้วไป Pass 2
  }

  // -------- Pass 2: ขยาย/ย่อ + invert + contrast --------
  let img2 = await readImage(absPath);
  try {
    const W = img2.bitmap.width;
    const H = img2.bitmap.height;
    const maxW = 1400, maxH = 1400;
    let tw = W, th = H;

    if (W < 600 && H < 600) {
      const k = Math.min(maxW / W, maxH / H);
      tw = Math.round(W * k);
      th = Math.round(H * k);
    } else if (W > maxW || H > maxH) {
      const k = Math.min(maxW / W, maxH / H);
      tw = Math.round(W * k);
      th = Math.round(H * k);
    }
    img2 = img2.resize({ w: tw, h: th });

    if (typeof img2.greyscale === 'function') img2.greyscale();
    else if (typeof img2.grayscale === 'function') img2.grayscale();

    if (typeof img2.invert === 'function') img2.invert();
    if (typeof img2.contrast === 'function') img2.contrast(0.8);
    if (typeof img2.normalize === 'function') img2.normalize();
  } catch (e) {
    console.warn('[QR_PREPROCESS_WARN:P2]', e);
  }

  try {
    const r2 = await tryDecode(img2);
    if (r2) return r2;
  } catch (e) {
    // สุดท้ายค่อยโยน null กลับ
  }

  return null;
}

/**
 * ตัว handler กลาง — ใช้ทั้งแบบ /verify-slip/:orderId และ /verify-slip?order_id=
 */
async function handleVerify(req, res, orderId) {
  const uid = req.user.uid;

  if (!orderId) return res.status(400).json({ message: 'missing order_id' });
  if (!req.file) return res.status(400).json({ message: 'missing slip file' });

  // ที่เก็บไฟล์จริง: /uploads/slips/<filename>
  const fileName   = req.file.filename;
  const slipUrl    = `/uploads/slips/${fileName}`; // ให้เปิดดูได้ผ่าน /uploads/*
  const slipAbs    = path.join(__dirname, '..', 'uploads', 'slips', fileName);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // เอาข้อมูลก่อนตรวจ
    const [rows] = await conn.query(
      `SELECT p.amount_expected, p.bill_ref, p.status, o.user_id
         FROM payments p
         JOIN orders   o ON p.order_id = o.order_id
        WHERE p.order_id = ?
        LIMIT 1`,
      [orderId]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'ไม่พบข้อมูลการชำระเงินของออเดอร์นี้' });
    }

    const pay = rows[0];
    if (pay.user_id !== uid) {
      await conn.rollback();
      return res.status(403).json({ message: 'ไม่มีสิทธิ์ยืนยันสลิปของออเดอร์นี้' });
    }

    // ถอด QR จากรูป
    let decoded = null;
    try {
      decoded = await decodeQR(slipAbs);
      if (decoded) console.log('[DECODED_QR]', decoded);
      else console.warn('WARN: cannot decode slip QR -> null');
    } catch (e) {
      console.warn('WARN: cannot decode slip QR ->', e);
    }

    // 1) เช็คหมายเลขพร้อมเพย์ร้าน (ต้องเจอใน payload)
    const shopPP = (process.env.PROMPTPAY_ID || '').replace(/\D/g, '');
    if (decoded && shopPP && !decoded.includes(shopPP)) {
      await conn.rollback();
      return res.status(400).json({ message: 'QR ในสลิปไม่ตรงกับหมายเลขพร้อมเพย์ของร้าน' });
    }

    // 2) ถ้ามี bill_ref ใน DB ต้องเจอใน payload
    if (decoded && pay.bill_ref && !decoded.includes(pay.bill_ref)) {
      await conn.rollback();
      return res.status(400).json({ message: 'QR ในสลิปไม่ตรงกับออเดอร์นี้ (bill_ref mismatch)' });
    }

    // 3) ลองดึงยอด ถ้าไม่มีใน payload ก็ไม่เป็นไร (บางสลิปไม่ฝังยอด)
    let slipAmount = null;
    if (decoded) {
      const m = decoded.match(/(\d+\.\d{2})/);
      if (m) slipAmount = parseFloat(m[1]);
    }
    const expected = parseFloat(pay.amount_expected || 0);
    if (Number.isFinite(slipAmount)) {
      if (Math.abs(slipAmount - expected) > 0.01) {
        await conn.rollback();
        return res.status(400).json({
          message: `ยอดไม่ตรง: สลิป ${slipAmount.toFixed(2)} ต้อง ${expected.toFixed(2)}`
        });
      }
    }

    // ผ่านเงื่อนไข → เก็บ url สลิป + mark paid
    await conn.query(
      `UPDATE payments
          SET payment_slip_url=?, status='paid', paid_at=NOW()
        WHERE order_id=?`,
      [slipUrl, orderId]
    );
    await conn.query(
      `UPDATE orders
          SET status='paid'
        WHERE order_id=?`,
      [orderId]
    );

    await conn.commit();
    return res.json({
      message: 'ตรวจสอบสลิปสำเร็จ ✅',
      order_id: orderId,
      slip_url: slipUrl,
      decoded_amount: Number.isFinite(slipAmount) ? slipAmount : null,
      expected_amount: expected
    });
  } catch (err) {
    await conn.rollback();
    console.error('[VERIFY_SLIP_ERROR]', err);
    return res.status(500).json({ message: 'verify error', detail: err.message });
  } finally {
    conn.release();
  }
}

/**
 * 2 รูปแบบให้ฟรอนต์ยิง
 * - POST /api/payments/verify-slip/:orderId     (หลัก)
 * - POST /api/payments/verify-slip?order_id=xx  (สำรอง)
 */
router.post(
  '/verify-slip/:orderId',
  verifyToken,
  upload.single('slip'),
  async (req, res) => handleVerify(req, res, Number(req.params.orderId))
);

router.post(
  '/verify-slip',
  verifyToken,
  upload.single('slip'),
  async (req, res) => handleVerify(req, res, Number(req.query.order_id))
);

module.exports = router;
