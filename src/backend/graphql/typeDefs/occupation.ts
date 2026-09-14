import { gql } from "graphql-tag";

export const occupationTypeDefs = gql`
  type OccupationResponse {
    success: Boolean!
    message: String!
    occupation: Occupation
  }

  type OccupationsResponse {
    success: Boolean!
    message: String!
    occupations: [Occupation!]
  }

  type Occupation {
    id: ID!
    name: String!
    createdAt: String! # Auto-generated timestamp
    updatedAt: String! # Auto-generated timestamp
  }

  type Query {
    occupations(search: String): OccupationsResponse!
    occupation(id: ID!): OccupationResponse!
  }

  type Mutation {
    # Create new occupation
    createOccupation(input: OccupationInput!): OccupationResponse!

    # Update existing occupation
    updateOccupation(id: ID!, input: OccupationInput!): OccupationResponse!

    # Delete occupation
    deleteOccupation(id: ID!): OccupationResponse!
  }

  input OccupationInput {
    name: String!
  }
`;
