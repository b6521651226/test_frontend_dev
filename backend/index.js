const express = require('express');
const cors = require('cors');
const app = express();
const orderRoutes = require('./routes/orders')


app.use(cors()); // <<< เพิ่มตรงนี้
app.use(express.json());
app.use('/api/orders', orderRoutes)

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

app.listen(4000, () => console.log('Backend running on :4000'));
