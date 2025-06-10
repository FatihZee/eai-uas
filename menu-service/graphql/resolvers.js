const { GraphQLError } = require('graphql');
const MenuService = require('../services/menuService');
const axios = require('axios');

module.exports = {
  Query: {
    menus: async (_, __, context) => {
      try {
        return await MenuService.getAllMenus(context.token);
      } catch (error) {
        throw new GraphQLError(`Failed to fetch menus: ${error.message}`, {
          extensions: { code: 'FETCH_ERROR' }
        });
      }
    },

    menu: async (_, { id }, context) => {
      try {
        return await MenuService.getMenuById(id, context.token);
      } catch (error) {
        throw new GraphQLError(`Failed to fetch menu: ${error.message}`, {
          extensions: { code: 'FETCH_ERROR' }
        });
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
      try {
        return await MenuService.createMenu(input, context.userId);
      } catch (error) {
        throw new GraphQLError(`Failed to create menu: ${error.message}`, {
          extensions: { code: 'CREATE_ERROR' }
        });
      }
    },

    updateMenu: async (_, { id, input }, context) => {
      try {
        return await MenuService.updateMenu(id, input, context.userId);
      } catch (error) {
        throw new GraphQLError(`Failed to update menu: ${error.message}`, {
          extensions: { code: 'UPDATE_ERROR' }
        });
      }
    },

    deleteMenu: async (_, { id }, context) => {
      try {
        return await MenuService.deleteMenu(id, context.userId);
      } catch (error) {
        throw new GraphQLError(`Failed to delete menu: ${error.message}`, {
          extensions: { code: 'DELETE_ERROR' }
        });
      }
    }
  }
};