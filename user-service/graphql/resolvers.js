const { GraphQLError } = require('graphql');
const UserService = require('../services/userService');

module.exports = {
  Query: {
    users: async (_, __, context) => {
      // Tambahkan pengecekan role jika hanya admin yang boleh lihat semua user
      // if (!context.user || context.user.role !== 'admin') {
      //   throw new GraphQLError('Not authorized to view all users.', {
      //     extensions: { code: 'FORBIDDEN' },
      //   });
      // }
      try {
        return await UserService.getAllUsers();
      } catch (error) {
        console.error('GraphQL Error fetching all users:', error);
        throw new GraphQLError(`Failed to fetch users: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    user: async (_, { id }, context) => {
      // User bisa lihat profil sendiri, atau admin bisa lihat profil siapa saja
      // if (context.user && (context.user.id === parseInt(id) || context.user.role === 'admin')) {
        try {
          const user = await UserService.getUserById(id);
          if (!user) {
            throw new GraphQLError('User not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          return user;
        } catch (error) {
          console.error(`GraphQL Error fetching user ${id}:`, error);
          if (error instanceof GraphQLError) throw error;
          throw new GraphQLError(`Failed to fetch user: ${error.message}`, {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }
      // } else {
      //   throw new GraphQLError('Not authorized to view this profile.', {
      //     extensions: { code: 'FORBIDDEN' },
      //   });
      // }
    },
    me: async (_, __, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const user = await UserService.getUserById(context.user.id);
        if (!user) {
          // Ini seharusnya tidak terjadi jika token valid dan user ada di DB
          throw new GraphQLError('User from token not found in database.', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }
        return user;
      } catch (error) {
        console.error(`GraphQL Error fetching 'me' (user ${context.user.id}):`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(`Failed to fetch current user: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  Mutation: {
    register: async (_, { input }) => {
      try {
        const newUser = await UserService.registerUser(input);
        return {
          message: 'User registered successfully',
          user: newUser,
        };
      } catch (error) {
        console.error('GraphQL Error registering user:', error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('required') || error.message.includes('Email already exists')) {
            code = 'BAD_USER_INPUT';
        }
        throw new GraphQLError(`Failed to register user: ${error.message}`, {
          extensions: { code },
        });
      }
    },
    login: async (_, { input }) => {
      try {
        const { token, user } = await UserService.loginUser(input.email, input.password);
        return { token, user };
      } catch (error) {
        console.error('GraphQL Error logging in user:', error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('required') || error.message.includes('Invalid email or password')) {
            code = 'BAD_USER_INPUT'; // Atau UNAUTHENTICATED jika lebih sesuai
        }
        throw new GraphQLError(`Login failed: ${error.message}`, {
          extensions: { code },
        });
      }
    },
    updateUser: async (_, { id, input }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      // User hanya bisa update profil sendiri, atau admin bisa update siapa saja
      // if (context.user.id !== parseInt(id) && context.user.role !== 'admin') {
      //   throw new GraphQLError('Not authorized to update this profile.', {
      //     extensions: { code: 'FORBIDDEN' },
      //   });
      // }
      try {
        // requestingUserId dari token
        await UserService.updateUser(id, input, context.user.id);
        const updatedUser = await UserService.getUserById(id); // Ambil user yang sudah diupdate
        return {
          message: 'User updated successfully',
          user: updatedUser,
        };
      } catch (error) {
        console.error(`GraphQL Error updating user ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to update user: ${error.message}`, {
          extensions: { code },
        });
      }
    },
    deleteUser: async (_, { id }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      // User hanya bisa delete profil sendiri, atau admin bisa delete siapa saja
      // if (context.user.id !== parseInt(id) && context.user.role !== 'admin') {
      //   throw new GraphQLError('Not authorized to delete this profile.', {
      //     extensions: { code: 'FORBIDDEN' },
      //   });
      // }
      try {
        const result = await UserService.deleteUser(id, context.user.id);
        return { message: result.message, id: result.id };
      } catch (error) {
        console.error(`GraphQL Error deleting user ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to delete user: ${error.message}`, {
          extensions: { code },
        });
      }
    },
  },
  // Field resolvers untuk data terkait User
  User: {
    orders: async (parentUser, _, context) => {
      // Pastikan ada token untuk mengambil data dari service lain
      if (!context.token) {
        console.warn(`User.orders: No token available to fetch orders for user ${parentUser.id}.`);
        return []; // Atau throw error jika orders selalu diharapkan
      }
      return UserService.getOrdersForUser(parentUser.id, context.token);
    },
    reviews: async (parentUser, _, context) => {
      if (!context.token) {
        console.warn(`User.reviews: No token available to fetch reviews for user ${parentUser.id}.`);
        return [];
      }
      return UserService.getReviewsForUser(parentUser.id, context.token);
    },
  },
};