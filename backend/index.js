require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');   // ✅ import path

const app = express();

app.use(cors({
  origin: ['http://localhost:5173'],   // frontend ที่อนุญาต
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/uploads')
const cartRoutes = require('./routes/cart');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const uploadMiddleware = require('./middlewares/upload'); // ✅ ใช้ multer สำหรับอัปโหลดไฟล์
const adminRoutes = require('./routes/admin');
const { verifyToken } = require('./middlewares/auth');
const verifySlipRoute = require('./routes/verifySlip');
console.log("PromptPay ID:", process.env.PROMPTPAY_ID);
app.use('/api/payments', verifySlipRoute);
app.use('/api/payments', require('./routes/payments'));

app.use('/uploads', express.static('public/uploads'));
app.use(express.json());
app.use('/api/admin', verifyToken, adminRoutes);
// auth
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes)

// ✅ ให้ express เสิร์ฟไฟล์ static ในโฟลเดอร์ uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// users
app.use('/api/users', verifyToken, userRoutes);

// orders & cart
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/cart', verifyToken, cartRoutes);

// products (public ดูได้, CRUD ไปใส่ verifyToken ใน route แทน)
app.use('/api/products', productRoutes);

app.listen(4000, () => console.log('Backend running on :4000'));
