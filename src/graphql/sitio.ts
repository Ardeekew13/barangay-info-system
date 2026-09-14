import { gql } from "@apollo/client";

// QUERIES
export const GET_SITIOS = gql`
  query GetSitios($search: String) {
    sitios(search: $search) {
      success
      message
      sitios {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_SITIO = gql`
  query GetSitio($id: ID!) {
    sitio(id: $id) {
      success
      message
      sitio {
        id
        name
        createdAt
        updatedAt
      }
    }
  }
`;

// MUTATIONS
export const CREATE_SITIO = gql`
  mutation CreateSitio($input: SitioInput!) {
    createSitio(input: $input) {
      success
      message
      sitio {
        id
        name
      }
    }
  }
`;

export const UPDATE_SITIO = gql`
  mutation UpdateSitio($id: ID!, $input: SitioInput!) {
    updateSitio(id: $id, input: $input) {
      success
      message
      sitio {
        id
        name
      }
    }
  }
`;

export const DELETE_SITIO = gql`
  mutation DeleteSitio($id: ID!) {
    deleteSitio(id: $id) {
      success
      message
    }
  }
`;
