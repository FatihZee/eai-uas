const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type User {
    id: ID!
    name: String!
    email: String!
    created_at: Date
  }

  type Menu {
    id: ID!
    name: String!
    description: String
    price: Float!
    orderCount: Int
    createdBy: User
    created_at: Date
    updated_at: Date
  }

  # NEW: Movie type untuk data dari gateway eksternal
  type Movie {
    id: ID!
    title: String!
    genre: String
    duration: String
    description: String
    releaseDate: String
  }

  input MenuInput {
    name: String!
    description: String
    price: Float!
  }

  type MenuResponse {
    message: String!
    menu: Menu
  }

  type Query {
    menus: [Menu!]!
    menu(id: ID!): Menu
    movies: [Movie!]!  # NEW: Query untuk movies
  }

  type Mutation {
    createMenu(input: MenuInput!): MenuResponse!
    updateMenu(id: ID!, input: MenuInput!): MenuResponse!
    deleteMenu(id: ID!): MenuResponse!
  }
`;

module.exports = typeDefs;