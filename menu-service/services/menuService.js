const Menu = require('../models/menuModel');
const axios = require('axios');

// URL layanan lain (ambil dari .env jika memungkinkan)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
// Jika order-service sudah GraphQL, kita akan panggil endpoint GraphQL-nya
const ORDER_SERVICE_GRAPHQL_URL = process.env.ORDER_SERVICE_GRAPHQL_URL || 'http://localhost:4003/graphql';

class MenuService {
  static async getAllMenus(token) { // Token mungkin dibutuhkan untuk mengambil orderCount
    return new Promise((resolve, reject) => {
      Menu.getAll(async (err, menus) => {
        if (err) {
          return reject(new Error('Failed to retrieve menus from database.'));
        }
        if (!menus || menus.length === 0) {
          return resolve([]);
        }
        // Enrich menus with order count
        try {
          const menusWithOrderCount = await Promise.all(
            menus.map(async (menu) => {
              const orderCount = await this.getOrderCountForMenu(menu.id, token);
              const createdBy = await this.getUserDetails(menu.user_id, token); // Ambil detail user
              return { ...menu, orderCount: orderCount, createdBy: createdBy };
            })
          );
          resolve(menusWithOrderCount);
        } catch (enrichError) {
          console.error("Error enriching menus:", enrichError);
          // Resolve dengan data menu dasar jika enrichment gagal
          resolve(menus.map(menu => ({ ...menu, orderCount: 0, createdBy: null })));
        }
      });
    });
  }

  static async getMenuById(id, token) { // Token untuk mengambil detail user
    return new Promise((resolve, reject) => {
      Menu.getById(id, async (err, results) => {
        if (err) {
          return reject(new Error(`Failed to retrieve menu ${id} from database.`));
        }
        if (results.length === 0) {
          return resolve(null);
        }
        const menu = results[0];
        try {
          const orderCount = await this.getOrderCountForMenu(menu.id, token);
          const createdBy = await this.getUserDetails(menu.user_id, token);
          resolve({ ...menu, orderCount: orderCount, createdBy: createdBy });
        } catch (enrichError) {
          console.error(`Error enriching menu ${id}:`, enrichError);
          resolve({ ...menu, orderCount: 0, createdBy: null });
        }
      });
    });
  }

  static async createMenu(menuData, userId, token) { // Token untuk mengambil detail user
    if (!menuData.name || !menuData.price || !userId) {
      throw new Error('Menu name, price, and user ID are required.');
    }
    const fullMenuData = { ...menuData, user_id: userId };

    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.getUserDetails(userId, token); // Ambil detail user yang membuat
        Menu.create(fullMenuData, (err, result) => {
          if (err) {
            return reject(new Error('Failed to create menu in database.'));
          }
          resolve({
            id: result.insertId,
            ...fullMenuData,
            createdBy: user, // Sertakan user yang membuat
            orderCount: 0 // Menu baru belum ada order
          });
        });
      } catch (error) {
        console.error('Error in MenuService.createMenu:', error.message);
        reject(new Error(`Failed to process menu creation: ${error.message}`));
      }
    });
  }

  static async updateMenu(id, menuData, requestingUserId, token) {
    // Pertama, cek apakah menu ada dan milik user yang benar
    const existingMenu = await this.getMenuById(id, token); // getMenuById sudah mengembalikan menu atau null
    if (!existingMenu) {
      throw new Error(`Menu with ID ${id} not found.`);
    }
    if (existingMenu.user_id !== requestingUserId) {
      throw new Error('User not authorized to update this menu.');
    }

    return new Promise(async (resolve, reject) => {
      Menu.update(id, menuData, async (err, result) => {
        if (err) {
          return reject(new Error(`Failed to update menu ${id} in database.`));
        }
        if (result.affectedRows === 0) {
          return reject(new Error(`Menu with ID ${id} not found for update.`));
        }
        // Ambil data menu yang sudah diupdate untuk response
        const updatedMenuWithDetails = await this.getMenuById(id, token);
        resolve(updatedMenuWithDetails);
      });
    });
  }

  static async deleteMenu(id, requestingUserId, token) {
    const existingMenu = await this.getMenuById(id, token);
    if (!existingMenu) {
      throw new Error(`Menu with ID ${id} not found.`);
    }
    if (existingMenu.user_id !== requestingUserId) {
      throw new Error('User not authorized to delete this menu.');
    }

    return new Promise((resolve, reject) => {
      Menu.delete(id, (err, result) => {
        if (err) {
          return reject(new Error(`Failed to delete menu ${id} from database.`));
        }
        if (result.affectedRows === 0) {
          return reject(new Error(`Menu with ID ${id} not found for deletion.`));
        }
        resolve({ message: 'Menu deleted successfully', id: id });
      });
    });
  }

  // Helper untuk mengambil jumlah order dari order-service via GraphQL
  static async getOrderCountForMenu(menuId, token) {
    try {
      const graphqlQuery = {
        query: `
          query GetOrderCountByMenu($menuId: ID!) {
            orderCountByMenu(menuId: $menuId) {
              count
            }
          }
        `,
        variables: { menuId: menuId.toString() }
      };
      const response = await axios.post(ORDER_SERVICE_GRAPHQL_URL, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': token }) // Kirim token jika order-service membutuhkannya
        }
      });
      if (response.data.errors) {
        console.error(`GraphQL errors for order count menu ${menuId}:`, response.data.errors);
        return 0;
      }
      return response.data.data.orderCountByMenu.count || 0;
    } catch (error) {
      console.error(`Error fetching order count for menu ${menuId} from OrderService:`, error.message);
      return 0; // Default jika gagal
    }
  }

  // Helper untuk mengambil detail user dari user-service
  // Asumsi user-service masih REST, jika sudah GraphQL, ini perlu diubah
  static async getUserDetails(userId, token) {
    if (!userId) return null;
    try {
      // Jika user-service sudah GraphQL, panggil endpoint GraphQL-nya
      // Untuk sekarang, kita asumsikan user-service masih REST atau akan diupdate nanti
      const userRes = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, {
        headers: { ...(token && { 'Authorization': token }) }
      });
      const user = userRes.data;
      delete user.password;
      return user;
    } catch (error) {
      console.error(`Error fetching user ${userId} from UserService:`, error.message);
      return { id: userId, name: 'Unknown User (Fetch Error)' }; // Fallback
    }
  }
}

module.exports = MenuService;