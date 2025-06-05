const OrderService = require('../services/orderService');

module.exports = {
  getAllOrders: async (req, res) => {
    try {
      const orders = await OrderService.getAllOrders();
      // Jika REST API juga butuh data user & menu, panggil enrichment di sini
      // const token = req.headers.authorization;
      // const enrichedOrders = await OrderService.enrichMultipleOrdersDetails(orders, token);
      // res.json(enrichedOrders);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get all orders', detail: error.message });
    }
  },

  createOrder: async (req, res) => {
    const userId = req.user.id; // Dari authMiddleware
    const { menuId, quantity } = req.body;
    const token = req.headers.authorization;

    try {
      const newOrder = await OrderService.createOrder(userId, menuId, quantity, token);
      res.status(201).json({
        message: 'Order created successfully',
        order: newOrder,
      });
    } catch (error) {
      console.error('Error in createOrder controller:', error.message);
      let statusCode = 500;
      if (error.message.includes('not found') || error.message.includes('Status: 404')) statusCode = 404;
      if (error.message.includes('required')) statusCode = 400;
      res.status(statusCode).json({ error: 'Failed to create order', detail: error.message });
    }
  },

  getOrderById: async (req, res) => {
    const id = req.params.id;
    try {
      const order = await OrderService.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      // Jika REST API butuh data user & menu untuk order tunggal
      // const token = req.headers.authorization;
      // const enrichedOrder = await OrderService.enrichOrderDetails(order, token);
      // res.json(enrichedOrder);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: `Failed to get order ${id}`, detail: error.message });
    }
  },

  updateOrder: async (req, res) => {
    const orderId = req.params.id;
    const userId = req.user.id; // Dari authMiddleware, atau bisa juga dari body jika admin bisa update order user lain
    const { menuId, quantity } = req.body;
    const token = req.headers.authorization;

    try {
      const updatedOrder = await OrderService.updateOrder(orderId, userId, menuId, quantity, token);
      res.json({
        message: 'Order updated successfully',
        order: updatedOrder,
      });
    } catch (error) {
      console.error(`Error in updateOrder controller for ID ${orderId}:`, error.message);
      let statusCode = 500;
      if (error.message.includes('not found') || error.message.includes('Status: 404')) statusCode = 404;
      if (error.message.includes('required')) statusCode = 400;
      if (error.message.includes('authorized')) statusCode = 403;
      res.status(statusCode).json({ error: 'Failed to update order', detail: error.message });
    }
  },

  deleteOrder: async (req, res) => {
    const id = req.params.id;
    // Anda mungkin ingin menambahkan validasi di sini apakah user yang melakukan delete berhak (misal, order miliknya atau admin)
    // const userId = req.user.id;
    try {
      const result = await OrderService.deleteOrder(id);
      res.json({ message: result.message, id: result.id });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      res.status(statusCode).json({ error: `Failed to delete order ${id}`, detail: error.message });
    }
  },

  getOrdersByUserId: async (req, res) => {
    const userId = req.params.userId;
    try {
      const orders = await OrderService.getOrdersByUserId(userId);
      // const token = req.headers.authorization;
      // const enrichedOrders = await OrderService.enrichMultipleOrdersDetails(orders, token);
      // res.json(enrichedOrders);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: `Failed to get orders for user ${userId}`, detail: error.message });
    }
  },

  getOrderCountByMenuId: async (req, res) => {
    const menuId = req.params.menuId;
    try {
      const result = await OrderService.getOrderCountByMenuId(menuId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: `Failed to get order count for menu ${menuId}`, detail: error.message });
    }
  },
};