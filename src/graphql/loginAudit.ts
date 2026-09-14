import { gql } from "@apollo/client";

export const GET_LOGIN_AUDITS = gql`
  query GetLoginAudits($username: String, $page: Int, $pageSize: Int) {
    loginAudits(username: $username, page: $page, pageSize: $pageSize) {
      success
      message
      totalCount
      audits {
        id
        username
        success
        reason
        ip
        userAgent
        createdAt
      }
    }
  }
`;
