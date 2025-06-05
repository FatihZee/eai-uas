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
  // Tidak perlu express.json() jika hanya GraphQL, tapi tidak masalah jika ada
  app.use(express.json()); 

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      service: 'Order Service GraphQL (Wrapper Approach)',
      timestamp: new Date().toISOString()
    });
  });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext, // Fungsi context untuk auth
    introspection: process.env.NODE_ENV !== 'production', // Aktifkan di dev/staging
    // playground: process.env.NODE_ENV !== 'production', // Apollo Server 3 default ke landing page
                                                          // Untuk playground eksplisit:
                                                          // const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
                                                          // plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    formatError: (err) => {
      // Log error server-side
      console.error("GraphQL Error:", JSON.stringify(err, null, 2));
      
      // Jangan ekspos detail error internal ke client di production
      if (process.env.NODE_ENV === 'production' && !err.extensions?.code?.startsWith('CONTROLLER_ERROR')) {
        return new Error('Internal server error');
      }
      return {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' }); // Path default adalah /graphql

  const PORT = process.env.GRAPHQL_PORT || 4003; // Gunakan port berbeda dari REST API
  
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL OrderService (Wrapper) running on http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`📊 GraphQL Playground/Landing Page available at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`💚 Health check available at http://localhost:${PORT}/health`);
  });
}

startServer().catch(error => {
  console.error('Fatal error starting GraphQL server:', error);
  process.exit(1);
});