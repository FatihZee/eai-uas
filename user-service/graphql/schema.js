const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    created_at: String
    updated_at: String
    orders: [Order!] # Relasi ke pesanan user
    reviews: [Review!] # Relasi ke review user
  }

  # Tipe Order yang relevan untuk User Service
  type Order {
    id: ID!
    # user_id: Int! # Tidak perlu, sudah dalam context User
    menu_id: Int!
    quantity: Int!
    total_price: Float!
    created_at: String
    menu: Menu # Detail menu dari pesanan
  }

  # Tipe Review yang relevan untuk User Service
  type Review {
    id: ID!
    # user_id: Int! # Tidak perlu
    menu_id: Int!
    order_id: Int!
    rating: Int!
    comment: String
    sentiment: String
    created_at: String
    menu: Menu # Detail menu yang direview
  }

  # Tipe Menu yang relevan (subset dari Menu di MenuService)
  type Menu {
    id: ID!
    name: String!
    price: Float
    description: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type UserActionResponse {
    message: String!
    user: User # Untuk register, bisa mengembalikan user yang baru dibuat
  }

  type DeleteUserResponse {
    message: String!
    id: ID
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    phone: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateUserInput {
    name: String
    email: String
    password: String # Opsional, hanya jika ingin ganti password
    phone: String
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    me: User # Mengambil data user yang sedang login (dari token)
  }

  type Mutation {
    register(input: RegisterInput!): UserActionResponse! # Mengembalikan user yang baru dibuat
    login(input: LoginInput!): AuthPayload!
    updateUser(id: ID!, input: UpdateUserInput!): UserActionResponse! # Bisa juga mengembalikan user yang diupdate
    deleteUser(id: ID!): DeleteUserResponse!
  }
`;

module.exports = typeDefs;