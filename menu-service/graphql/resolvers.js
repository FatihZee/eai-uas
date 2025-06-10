const { GraphQLError } = require('graphql');
const MenuService = require('../services/menuService');
const DateScalar = require('./dateScalar');
const axios = require('axios');

module.exports = {
  // Add Date scalar resolver
  Date: DateScalar,

  Query: {
    menus: async (_, __, context) => {
      try {
        return await MenuService.getAllMenus(context.token);
      } catch (error) {
        console.error('GraphQL Error fetching all menus:', error);
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
    menu: async (_, { id }, context) => {
      try {
        const menu = await MenuService.getMenuById(id, context.token);
        if (!menu) {
          throw new GraphQLError('Menu not found', { extensions: { code: 'NOT_FOUND' } });
        }
        return menu;
      } catch (error) {
        console.error(`GraphQL Error fetching menu ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
    movies: async (_, __, context) => {
      try {
        console.log('🎬 Fetching movies from external gateway: tubes_eai_gateway:5000');
        
        const response = await axios.post('http://tubes_eai_gateway:5000/graphql', {
          query: `
            query {
              movies {
                id
                title
                genre
                duration
                description
                releaseDate
              }
            }
          `
        }, {
          headers: {
            'Content-Type': 'application/json',
            ...(context.token && { 'Authorization': context.token })
          },
          timeout: 10000 // 10 second timeout
        });

        console.log('Gateway response status:', response.status);

        if (response.data.errors) {
          console.error('🚨 Gateway GraphQL errors:', response.data.errors);
          return [];
        }

        const movies = response.data.data?.movies || [];
        console.log(`✅ Successfully fetched ${movies.length} movies from external gateway`);
        
        return movies;

      } catch (error) {
        console.error('❌ Error fetching movies from external gateway:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });
        
        return [];
      }
    }
  },
  Mutation: {
    createMenu: async (_, { input }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      try {
        const menu = await MenuService.createMenu(input, context.user.id, context.token);
        return {
          message: 'Menu created successfully',
          menu
        };
      } catch (error) {
        console.error('GraphQL Error creating menu:', error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('required')) code = 'BAD_USER_INPUT';
        throw new GraphQLError(error.message, { extensions: { code } });
      }
    },
    updateMenu: async (_, { id, input }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      try {
        const menu = await MenuService.updateMenu(id, input, context.user.id, context.token);
        return {
          message: 'Menu updated successfully',
          menu
        };
      } catch (error) {
        console.error(`GraphQL Error updating menu ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(error.message, { extensions: { code } });
      }
    },
    deleteMenu: async (_, { id }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      try {
        const result = await MenuService.deleteMenu(id, context.user.id, context.token);
        return result;
      } catch (error) {
        console.error(`GraphQL Error deleting menu ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(error.message, { extensions: { code } });
      }
    }
  },
  // Field resolvers sudah tidak diperlukan karena Date scalar menangani formatting
  // Date scalar akan otomatis handle semua field dengan type Date
};