const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, menuController.createMenu);
router.put('/:id', authMiddleware, menuController.updateMenu);
router.delete('/:id', authMiddleware, menuController.deleteMenu);
router.get('/', menuController.getAllMenus);
router.get('/:id', menuController.getMenuById);

module.exports = router;