const express = require('express');
const cors = require('cors');
const app = express();
const orderRoutes = require('./routes/orders')
const cartRoutes = require('./routes/cart')
const authRoutes = require('./routes/auth');
const { verifyToken} = require('./middlewares/auth');

app.use(cors()); // <<< เพิ่มตรงนี้
app.use(express.json());
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes);
app.use('/api/auth', authRoutes);
// ตัวอย่าง: สั่งซื้อ/ตะกร้าต้องล็อกอิน
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/cart', verifyToken, cartRoutes);

// ตัวอย่าง: สินค้าเฉพาะแอดมิน



const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

app.listen(4000, () => console.log('Backend running on :4000'));
