const express = require('express');
const cors = require('cors');
const app = express();
const orderRoutes = require('./routes/orders')
const cartRoutes = require('./routes/cart');


app.use(cors()); // <<< เพิ่มตรงนี้
app.use(express.json());
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes); 

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

app.listen(4000, () => console.log('Backend running on :4000'));
