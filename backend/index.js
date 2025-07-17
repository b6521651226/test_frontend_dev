const express = require('express');
const app = express();
app.use(express.json());

// ดึง route มาเชื่อม
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

app.listen(4000, () => console.log('Backend running on :4000'));
