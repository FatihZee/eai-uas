const Menu = require('../models/menuModel');
const axios = require('axios');
require('dotenv').config();

// URL layanan lain
const USER_SERVICE_GRAPHQL_URL = process.env.USER_SERVICE_GRAPHQL_URL || 'http://localhost:4001/graphql';
const ORDER_SERVICE_GRAPHQL_URL = process.env.ORDER_SERVICE_GRAPHQL_URL || 'http://localhost:4003/graphql';

class MenuService {
  // Helper method untuk memastikan tanggal adalah Date objects
  static formatMenuDate(menu) {
    if (!menu) return null;
    
    return {
      ...menu,
      created_at: menu.created_at ? new Date(menu.created_at) : new Date(),
      updated_at: menu.updated_at ? new Date(menu.updated_at) : new Date()
    };
  }

  static async getAllMenus(token) {
    return new Promise((resolve, reject) => {
      Menu.getAll(async (err, menus) => {
        if (err) {
          return reject(new Error('Failed to retrieve menus from database.'));
        }
        if (!menus || menus.length === 0) {
          return resolve([]);
        }
        
        try {
          const menusWithOrderCount = await Promise.all(
            menus.map(async (menu) => {
              const orderCount = await this.getOrderCountForMenu(menu.id, token);
              const createdBy = await this.getUserDetails(menu.user_id, token);
              
              // Format tanggal sebagai Date objects
              const formattedMenu = this.formatMenuDate(menu);
              
              return { 
                ...formattedMenu, 
                orderCount: orderCount, 
                createdBy: createdBy 
              };
            })
          );
          resolve(menusWithOrderCount);
        } catch (enrichError) {
          console.error("Error enriching menus:", enrichError);
          // Return menu dengan format tanggal yang benar meskipun enrichment gagal
          const formattedMenus = menus.map(menu => this.formatMenuDate(menu));
          resolve(formattedMenus);
        }
      });
    });
  }

  static async getMenuById(id, token) {
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
          
          // Format tanggal sebagai Date objects
          const formattedMenu = this.formatMenuDate(menu);
          
          resolve({ 
            ...formattedMenu, 
            orderCount: orderCount, 
            createdBy: createdBy 
          });
        } catch (enrichError) {
          console.error(`Error enriching menu ${id}:`, enrichError);
          resolve({ 
            ...this.formatMenuDate(menu), 
            orderCount: 0, 
            createdBy: null 
          });
        }
      });
    });
  }

  static async createMenu(menuData, userId, token) {
    if (!menuData.name || !menuData.price || !userId) {
      throw new Error('Menu name, price, and user ID are required.');
    }
    
    const now = new Date();
    const fullMenuData = { 
      ...menuData, 
      user_id: userId,
      created_at: now,
      updated_at: now
    };

    return new Promise(async (resolve, reject) => {
      try {
        const user = await this.getUserDetails(userId, token);
        Menu.create(fullMenuData, (err, result) => {
          if (err) {
            return reject(new Error('Failed to create menu in database.'));
          }
          
          const createdMenu = {
            id: result.insertId,
            ...fullMenuData,
            createdBy: user,
            orderCount: 0
          };
          
          // Pastikan return Date objects
          resolve(this.formatMenuDate(createdMenu));
        });
      } catch (error) {
        console.error('Error in MenuService.createMenu:', error.message);
        reject(new Error(`Failed to process menu creation: ${error.message}`));
      }
    });
  }

  static async updateMenu(id, menuData, requestingUserId, token) {
    const existingMenu = await this.getMenuById(id, token);
    if (!existingMenu) {
      throw new Error(`Menu with ID ${id} not found.`);
    }
    if (existingMenu.user_id !== requestingUserId) {
      throw new Error('User not authorized to update this menu.');
    }

    // Tambahkan updated_at sebagai Date object
    const updateData = {
      ...menuData,
      updated_at: new Date()
    };

    return new Promise(async (resolve, reject) => {
      Menu.update(id, updateData, async (err, result) => {
        if (err) {
          return reject(new Error(`Failed to update menu ${id} in database.`));
        }
        if (result.affectedRows === 0) {
          return reject(new Error(`Menu with ID ${id} not found for update.`));
        }
        
        // Return updated menu dengan Date objects
        const updatedMenu = await this.getMenuById(id, token);
        resolve(updatedMenu);
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

  // Helper methods tetap sama...
  static async getUserDetails(userId, token) {
    if (!userId) return null;
    try {
      const response = await axios.post(USER_SERVICE_GRAPHQL_URL, {
        query: `query GetUser($id: ID!) { user(id: $id) { id name email created_at } }`,
        variables: { id: userId.toString() }
      }, { 
        headers: { 
          'Content-Type': 'application/json', 
          ...(token && { 'Authorization': token }) 
        } 
      });
      
      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return { id: userId, name: 'Unknown User', email: 'unknown@example.com' };
      }
      const user = response.data.data.user || { id: userId, name: 'Unknown User', email: 'unknown@example.com' };
      
      // Format user created_at juga sebagai Date object
      if (user.created_at) {
        user.created_at = new Date(user.created_at);
      }
      
      return user;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.message);
      return { id: userId, name: 'Unknown User', email: 'unknown@example.com' };
    }
  }

  static async getOrderCountForMenu(menuId, token) {
    try {
      const response = await axios.post(ORDER_SERVICE_GRAPHQL_URL, {
        query: `query GetOrderCount($menuId: ID!) { orderCountByMenu(menuId: $menuId) { count } }`,
        variables: { menuId: menuId.toString() }
      }, { 
        headers: { 
          'Content-Type': 'application/json', 
          ...(token && { 'Authorization': token }) 
        } 
      });
      
      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return 0;
      }
      return response.data.data.orderCountByMenu?.count || 0;
    } catch (error) {
      console.error(`Error fetching order count for menu ${menuId}:`, error.message);
      return 0;
    }
  }
}

module.exports = MenuService;