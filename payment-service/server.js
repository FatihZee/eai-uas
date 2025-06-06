const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const sequelize = require('./config/db');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const createContext = require('./graphql/context');
const paymentRoutes = require('./routes/paymentRoutes');
require('dotenv').config();

async function startServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json()); 

  // Health check endpoints
  app.get('/health_gql', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      service: 'Payment Service GraphQL',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      service: 'Payment Service REST + GraphQL',
      timestamp: new Date().toISOString()
    });
  });

  // IMPORTANT: Mount REST API routes BEFORE GraphQL
  app.use('/api/payments', paymentRoutes);

  // Initialize GraphQL server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (err) => {
      console.error("GraphQL Error (PaymentService):", JSON.stringify(err, null, 2));
      return {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  // Connect to database
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');
    await sequelize.sync();
    console.log('✅ Database synchronized.');
  } catch (err) {
    console.error('❌ Unable to connect to database:', err);
    process.exit(1);
  }

  const PORT = process.env.GRAPHQL_PORT || 4005;
  
  app.listen(PORT, () => {
    console.log(`🚀 Payment Service running on http://localhost:${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔄 REST API: http://localhost:${PORT}/api/payments`);
    console.log(`🔔 Webhook endpoint: http://localhost:${PORT}/api/payments/webhook/midtrans`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch(error => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});