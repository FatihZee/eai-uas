const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/orders', orderRoutes);

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`OrderService running on http://localhost:${PORT}`);
});
