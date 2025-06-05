const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Menu {
    id: ID!
    name: String!
    description: String
    price: Float!
    user_id: Int! # ID user yang membuat
    created_at: String
    updated_at: String
    orderCount: Int # Jumlah menu ini dipesan
    createdBy: User # Detail user yang membuat
  }

  type User {
    id: ID!
    name: String
    email: String
    # Tambahkan field lain dari User jika perlu, tanpa password
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
    # user_id akan diambil dari context token
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