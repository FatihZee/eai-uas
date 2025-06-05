const MenuService = require('../services/menuService'); // Menggunakan MenuService

module.exports = {
  getAllMenus: async (req, res) => {
    try {
      const token = req.headers.authorization;
      const menus = await MenuService.getAllMenus(token); // Service akan handle enrichment
      res.json(menus);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get all menus', detail: error.message });
    }
  },

  getMenuById: async (req, res) => {
    const id = req.params.id;
    const token = req.headers.authorization;
    try {
      const menu = await MenuService.getMenuById(id, token); // Service akan handle enrichment
      if (!menu) {
        return res.status(404).json({ message: 'Menu not found' });
      }
      res.json(menu);
    } catch (error) {
      res.status(500).json({ error: `Failed to get menu ${id}`, detail: error.message });
    }
  },

  createMenu: async (req, res) => {
    const menuData = req.body;
    const userId = req.user.id; // Dari authMiddleware
    const token = req.headers.authorization;

    try {
      const newMenu = await MenuService.createMenu(menuData, userId, token);
      res.status(201).json({
        message: 'Menu created successfully',
        menu: newMenu, // Mengembalikan menu yang sudah di-enrich
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('required')) statusCode = 400;
      res.status(statusCode).json({ error: 'Failed to create menu', detail: error.message });
    }
  },

  updateMenu: async (req, res) => {
    const id = req.params.id;
    const menuData = req.body;
    const userId = req.user.id; // Dari authMiddleware
    const token = req.headers.authorization;

    try {
      const updatedMenu = await MenuService.updateMenu(id, menuData, userId, token);
      res.json({
        message: 'Menu updated successfully',
        menu: updatedMenu,
      });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('authorized')) statusCode = 403;
      res.status(statusCode).json({ error: 'Failed to update menu', detail: error.message });
    }
  },

  deleteMenu: async (req, res) => {
    const id = req.params.id;
    const userId = req.user.id; // Dari authMiddleware
    const token = req.headers.authorization;

    try {
      const result = await MenuService.deleteMenu(id, userId, token);
      res.json({ message: result.message, id: result.id });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('authorized')) statusCode = 403;
      res.status(statusCode).json({ error: `Failed to delete menu ${id}`, detail: error.message });
    }
  },
};
