const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const reviewRoutes = require('./routes/reviewRoutes');

dotenv.config();

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());

app.use('/reviews', reviewRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Review Service API is running' });
});

app.listen(PORT, () => {
  console.log(`ReviewService running on port http://localhost:${PORT}`);
});

module.exports = app;