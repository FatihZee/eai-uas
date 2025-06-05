const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const menuRoutes = require('./routes/menuRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/menus', menuRoutes);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`MenuService running on http://localhost:${PORT}`);
});
