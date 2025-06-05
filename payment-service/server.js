const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const createContext = require('./graphql/context');
require('dotenv').config();

async function startServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json()); 

  app.get('/health_gql', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      service: 'Payment Service GraphQL',
      timestamp: new Date().toISOString()
    });
  });

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

  const PORT = process.env.GRAPHQL_PORT || 4005; // Port berbeda dari REST API
  
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL PaymentService running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(error => {
  console.error('Error starting GraphQL server:', error);
});