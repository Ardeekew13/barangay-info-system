import { gql } from "@apollo/client";

// QUERIES
export const GET_USERS = gql`
  query GetUsers($search: String) {
    users(search: $search) {
      success
      message
      users {
        id
        username
        name
        role
        isActive
        createdAt
        updatedAt
      }
    }
  }
`;

// MUTATIONS
export const CREATE_USER_ACCOUNT = gql`
  mutation CreateUserAccount($input: CreateUserAccountInput!) {
    createUserAccount(input: $input) {
      success
      message
      user {
        id
        username
        name
        role
        isActive
      }
    }
  }
`;

export const UPDATE_USER_ACCOUNT = gql`
  mutation UpdateUserAccount($id: ID!, $input: UpdateUserAccountInput!) {
    updateUserAccount(id: $id, input: $input) {
      success
      message
      user {
        id
        username
        name
        role
        isActive
      }
    }
  }
`;

export const RESET_USER_ACCOUNT_PASSWORD = gql`
  mutation ResetUserAccountPassword($id: ID!, $newPassword: String!) {
    resetUserAccountPassword(id: $id, newPassword: $newPassword) {
      success
      message
    }
  }
`;
