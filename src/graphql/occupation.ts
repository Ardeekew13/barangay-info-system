import { gql } from "@apollo/client";

// QUERIES
export const GET_OCCUPATIONS = gql`
  query GetOccupations($search: String) {
    occupations(search: $search) {
      success
      message
      occupations {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_OCCUPATION = gql`
  query GetOccupation($id: ID!) {
    occupation(id: $id) {
      success
      message
      occupation {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;

// MUTATIONS
export const CREATE_OCCUPATION = gql`
  mutation CreateOccupation($input: OccupationInput!) {
    createOccupation(input: $input) {
      success
      message
      occupation {
        id
        name
      }
    }
  }
`;

export const UPDATE_OCCUPATION = gql`
  mutation UpdateOccupation($id: ID!, $input: OccupationInput!) {
    updateOccupation(id: $id, input: $input) {
      success
      message
      occupation {
        id
        name
      }
    }
  }
`;

export const DELETE_OCCUPATION = gql`
  mutation DeleteOccupation($id: ID!) {
    deleteOccupation(id: $id) {
      success
      message
    }
  }
`;
