const { GraphQLError } = require('graphql');
const MenuService = require('../services/menuService');

module.exports = {
  Query: {
    menus: async (_, __, context) => {
      try {
        // context.token mungkin diperlukan untuk mengambil orderCount atau createdBy
        return await MenuService.getAllMenus(context.token);
      } catch (error) {
        console.error('GraphQL Error fetching all menus:', error);
        throw new GraphQLError(`Failed to fetch menus: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    menu: async (_, { id }, context) => {
      try {
        const menu = await MenuService.getMenuById(id, context.token);
        if (!menu) {
          throw new GraphQLError('Menu not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return menu;
      } catch (error) {
        console.error(`GraphQL Error fetching menu ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(`Failed to fetch menu: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  Mutation: {
    createMenu: async (_, { input }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const newMenu = await MenuService.createMenu(input, context.user.id, context.token);
        return {
          message: 'Menu created successfully',
          menu: newMenu,
        };
      } catch (error) {
        console.error('GraphQL Error creating menu:', error);
        throw new GraphQLError(`Failed to create menu: ${error.message}`, {
          extensions: { code: error.message.includes('required') ? 'BAD_USER_INPUT' : 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    updateMenu: async (_, { id, input }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const updatedMenu = await MenuService.updateMenu(id, input, context.user.id, context.token);
        return {
          message: 'Menu updated successfully',
          menu: updatedMenu,
        };
      } catch (error) {
        console.error(`GraphQL Error updating menu ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to update menu: ${error.message}`, {
          extensions: { code },
        });
      }
    },
    deleteMenu: async (_, { id }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const result = await MenuService.deleteMenu(id, context.user.id, context.token); // Pass token if needed by getMenuById in service
        return { message: result.message, id: result.id };
      } catch (error) {
        console.error(`GraphQL Error deleting menu ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to delete menu: ${error.message}`, {
          extensions: { code },
        });
      }
    },
  },
  // Field resolvers jika diperlukan (misal jika createdBy atau orderCount tidak di-resolve oleh service utama)
  // Menu: {
  //   createdBy: async (parentMenu, _, context) => {
  //     if (parentMenu.createdBy) return parentMenu.createdBy; // Jika sudah di-enrich
  //     if (!parentMenu.user_id) return null;
  //     return MenuService.getUserDetails(parentMenu.user_id, context.token);
  //   },
  //   orderCount: async (parentMenu, _, context) => {
  //     if (parentMenu.orderCount !== undefined) return parentMenu.orderCount; // Jika sudah di-enrich
  //     return MenuService.getOrderCountForMenu(parentMenu.id, context.token);
  //   }
  // }
};