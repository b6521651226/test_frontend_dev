const express = require('express');
const cors = require('cors');
const path = require('path');   // ✅ import path

const app = express();

const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const uploadMiddleware = require('./middlewares/upload'); // ✅ ใช้ multer สำหรับอัปโหลดไฟล์
const adminRoutes = require('./routes/admin');
const { verifyToken } = require('./middlewares/auth');

app.use(cors());
app.use(express.json());
app.use('/api/admin', verifyToken, adminRoutes);
// auth
app.use('/api/auth', authRoutes);

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
