const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type Menu {
    id: ID!
    name: String!
    description: String
    price: Float!
    user_id: Int!
    created_at: Date  # Menggunakan Date scalar
    updated_at: Date  # Menggunakan Date scalar
    orderCount: Int
    createdBy: User
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    created_at: Date  # Menggunakan Date scalar
  }

  type MenuActionResponse {
    message: String!
    menu: Menu
  }

  type DeleteMenuResponse {
    message: String!
    id: ID
  }

  input CreateMenuInput {
    name: String!
    description: String
    price: Float!
  }

  input UpdateMenuInput {
    name: String
    description: String
    price: Float
  }

  type Query {
    menus: [Menu!]!
    menu(id: ID!): Menu
  }

  type Mutation {
    createMenu(input: CreateMenuInput!): MenuActionResponse!
    updateMenu(id: ID!, input: UpdateMenuInput!): MenuActionResponse!
    deleteMenu(id: ID!): DeleteMenuResponse!
  }
`;

module.exports = typeDefs;