const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Order {
    id: ID!
    user_id: Int!
    menu_id: Int!
    quantity: Int!
    total_price: Float!
    created_at: String
    user: User # Relasi ke User
    menu: Menu # Relasi ke Menu
  }

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    created_at: String
    updated_at: String
    # Password tidak disertakan
  }

  type Menu {
    id: ID!
    name: String!
    description: String
    price: Float!
    user_id: Int # ID user yang membuat menu
    created_at: String
    updated_at: String
  }

  # Response type untuk create/update order
  type OrderActionResponse {
    message: String!
    order: Order!
  }

  # Response type untuk delete order
  type DeleteOrderResponse {
    message: String!
    id: ID # ID order yang dihapus
  }

  type OrderCount {
    count: Int!
  }

  type Query {
    orders: [Order!]!
    order(id: ID!): Order
    ordersByUser(userId: ID!): [Order!]!
    orderCountByMenu(menuId: ID!): OrderCount!
  }

  type Mutation {
    createOrder(menuId: ID!, quantity: Int!): OrderActionResponse!
    updateOrder(id: ID!, menuId: ID!, quantity: Int!): OrderActionResponse!
    deleteOrder(id: ID!): DeleteOrderResponse!
  }
`;

module.exports = typeDefs;