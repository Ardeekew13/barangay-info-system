import { gql } from "graphql-tag";

export const sitioTypeDefs = gql`
  type SitioResponse {
    success: Boolean!
    message: String!
    sitio: Sitio
  }

  type SitiosResponse {
    success: Boolean!
    message: String!
    sitios: [Sitio!]
  }

  type Sitio {
    id: ID!
    name: String! 
    createdAt: String! # Auto-generated timestamp
    updatedAt: String! # Auto-generated timestamp
  }

  type Query {
    sitios(search: String): SitiosResponse!
    sitio(id: ID!): SitioResponse!
  }

  type Mutation {
    # Create new sitio
    createSitio(input: SitioInput!): SitioResponse!

    # Update existing sitio
    updateSitio(id: ID!, input: SitioInput!): SitioResponse!

    # Delete sitio
    deleteSitio(id: ID!): SitioResponse!
  }

  input SitioInput {
    name: String!
  }
`;
