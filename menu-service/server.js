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

  // Health check untuk GraphQL server
  app.get('/health_gql', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      service: 'Menu Service GraphQL',
      timestamp: new Date().toISOString()
    });
  });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (err) => {
      console.error("GraphQL Error (MenuService):", JSON.stringify(err, null, 2));
      return {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' }); // Endpoint GraphQL

  const PORT = process.env.GRAPHQL_PORT || 4002; // Port berbeda dari REST API
  
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL MenuService running on http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`💚 GraphQL Health check available at http://localhost:${PORT}/health_gql`);
  });
}

startServer().catch(error => {
  console.error('Fatal error starting GraphQL server (MenuService):', error);
  process.exit(1);
});