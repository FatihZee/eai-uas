const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/users', userRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`UserService running on http://localhost:${PORT}`);
});
