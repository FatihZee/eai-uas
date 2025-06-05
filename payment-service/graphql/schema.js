const { gql } = require('apollo-server-express');

module.exports = gql`
  type Payment {
    id: ID!
    user_id: Int!
    order_id: Int!
    midtrans_order_id: String!
    amount: Float!
    payment_method: String
    status: String!
    snap_token: String
    redirect_url: String
    transaction_time: String

    user: User
    order: Order
  }

  type User {
    id: ID!
    name: String
    email: String
  }

  type Order {
    id: ID!
    total_price: Float
    created_at: String
    user_id: Int
    menu_id: Int
    quantity: Int
  }

  type PaymentStats {
    total_payments: Int!
    total_amount: Float!
    pending_count: Int!
    paid_count: Int!
    failed_count: Int!
    cancelled_count: Int!
  }

  type UserPaymentStats {
    user_id: Int!
    total_payments: Int!
    total_amount: Float!
    pending_amount: Float!
    paid_amount: Float!
  }

  type CreatePaymentResponse {
    message: String!
    payment: Payment
    redirect_url: String
  }

  type PaymentActionResponse {
    message: String!
    payment: Payment
  }

  type DeletePaymentResponse {
    message: String!
    id: ID
  }

  input CreatePaymentInput {
    orderId: ID!
  }

  input UpdatePaymentInput {
    status: String
    payment_method: String
  }

  type Query {
    payments: [Payment!]!
    payment(id: ID!): Payment
    paymentsByUser(userId: ID!): [Payment!]!
    paymentsByOrder(orderId: ID!): [Payment!]!
    paymentsByStatus(status: String!): [Payment!]!
    paymentStats: PaymentStats!
    paymentStatsByUser(userId: ID!): UserPaymentStats!
  }

  type Mutation {
    createPayment(input: CreatePaymentInput!): CreatePaymentResponse!
    updatePayment(id: ID!, input: UpdatePaymentInput!): PaymentActionResponse!
    deletePayment(id: ID!): DeletePaymentResponse!
    processPayment(id: ID!): PaymentActionResponse!
    cancelPayment(id: ID!): PaymentActionResponse!
  }
`;