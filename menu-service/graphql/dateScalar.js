const { GraphQLScalarType, GraphQLError } = require('graphql');
const { Kind } = require('graphql/language');

const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    // Serialize: Convert internal representation to external
    if (!value) {
      return new Date().toISOString(); // Return current date for null/undefined
    }
    
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        console.warn('Invalid Date object detected, using current date');
        return new Date().toISOString();
      }
      return value.toISOString();
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string/number: ${value}, using current date`);
        return new Date().toISOString();
      }
      return date.toISOString();
    }
    
    console.warn(`Unexpected date value type: ${typeof value}, value: ${value}, using current date`);
    return new Date().toISOString();
  },
  parseValue(value) {
    // ParseValue: Convert external input to internal representation
    if (!value) {
      return new Date(); // Return current date for null/undefined
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date input: ${value}, using current date`);
        return new Date();
      }
      return date;
    }
    
    console.warn(`Invalid date input type: ${typeof value}, using current date`);
    return new Date();
  },
  parseLiteral(ast) {
    // ParseLiteral: Convert AST literal to internal representation
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date literal: ${ast.value}, using current date`);
        return new Date();
      }
      return date;
    }
    
    console.warn(`Invalid date literal kind: ${ast.kind}, using current date`);
    return new Date();
  },
});

module.exports = DateScalar;