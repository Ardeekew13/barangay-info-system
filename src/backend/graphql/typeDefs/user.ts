import { gql } from "graphql-tag";

export const userTypeDefs = gql`
  # Login accounts (username/password/role) -- separate from Resident records.
  # The password hash is never exposed here.
  type UserAccount {
    id: ID!
    username: String!
    name: String!
    role: String! # "admin" | "encoder" | "viewer"
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type UserAccountResponse {
    success: Boolean!
    message: String!
    user: UserAccount
  }

  type UserAccountsResponse {
    success: Boolean!
    message: String!
    users: [UserAccount!]
  }

  type Query {
    users(search: String): UserAccountsResponse!
  }

  type Mutation {
    createUserAccount(input: CreateUserAccountInput!): UserAccountResponse!
    updateUserAccount(id: ID!, input: UpdateUserAccountInput!): UserAccountResponse!
    resetUserAccountPassword(id: ID!, newPassword: String!): UserAccountResponse!
  }

  input CreateUserAccountInput {
    username: String!
    name: String!
    password: String!
    role: String!
  }

  input UpdateUserAccountInput {
    name: String
    role: String
    isActive: Boolean
  }
`;
