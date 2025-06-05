const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const paymentRoutes = require('./routes/paymentRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Payment Service REST',
    timestamp: new Date().toISOString()
  });
});

// REST API routes
app.use('/api/payments', paymentRoutes);

// Test koneksi DB
sequelize.authenticate()
  .then(() => {
    console.log('Database connected.');
    return sequelize.sync(); // auto sync model
  })
  .then(() => {
    const PORT = process.env.PORT || 3005;
    app.listen(PORT, () => {
      console.log(`🚀 REST PaymentService running on http://localhost:${PORT}`);
      console.log(`💚 Health check available at http://localhost:${PORT}/health`);
    });
  })
  .catch(err => console.error('Unable to connect to DB:', err));
