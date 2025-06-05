const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Review {
    id: ID!
    user_id: Int!
    menu_id: Int!
    order_id: Int!
    rating: Int!
    comment: String
    sentiment: String # positive, negative, neutral - dari Gemini AI
    created_at: String
    updated_at: String
    user: User # Detail user dari User Service
    menu: Menu # Detail menu dari Menu Service
    order: Order # Detail order dari Order Service (opsional)
  }

  type User {
    id: ID!
    name: String
    email: String
    phone: String
  }

  type Menu {
    id: ID!
    name: String
    description: String
    price: Float
  }

  type Order {
    id: ID!
    user_id: Int
    menu_id: Int
    quantity: Int
    total_price: Float
  }

  type ReviewActionResponse {
    message: String!
    review: Review
  }

  type DeleteReviewResponse {
    message: String!
    id: ID
  }

  type ReviewStats {
    menu: Menu # Detail menu yang statistiknya diambil
    averageRating: Float!
    reviewCount: Int!
  }

  type SentimentStats {
    menuId: ID!
    positive: Int!
    negative: Int!
    neutral: Int!
    total: Int!
    positivePercentage: Float!
    negativePercentage: Float!
    neutralPercentage: Float!
  }

  input CreateReviewInput {
    orderId: ID! # ID Order yang direview
    rating: Int!
    comment: String
  }

  input UpdateReviewInput {
    rating: Int
    comment: String
  }

  type Query {
    reviews: [Review!]!
    review(id: ID!): Review
    reviewsByUser(userId: ID!): [Review!]
    reviewsByMenu(menuId: ID!): [Review!]
    reviewsByOrder(orderId: ID!): [Review!]
    reviewStatsByMenu(menuId: ID!): ReviewStats
    reviewsByMenuAndSentiment(menuId: ID!, sentiment: String!): [Review!]
    sentimentStatsByMenu(menuId: ID!): SentimentStats
  }

  type Mutation {
    createReview(input: CreateReviewInput!): ReviewActionResponse!
    updateReview(id: ID!, input: UpdateReviewInput!): ReviewActionResponse!
    deleteReview(id: ID!): DeleteReviewResponse!
  }
`;

module.exports = typeDefs;