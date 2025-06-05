const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const paymentRoutes = require('./routes/paymentRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use('/api/payments', paymentRoutes);

// Test koneksi DB
sequelize.authenticate()
    .then(() => {
        console.log('Database connected.');
        return sequelize.sync(); // auto sync model
    })
    .then(() => {
        const PORT = process.env.PORT || 3005;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('Unable to connect to DB:', err));
