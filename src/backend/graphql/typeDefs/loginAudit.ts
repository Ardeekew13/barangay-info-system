import { gql } from "graphql-tag";

export const loginAuditTypeDefs = gql`
	type LoginAuditEntry {
		id: ID!
		username: String!
		success: Boolean!
		reason: String!
		ip: String
		userAgent: String
		createdAt: String!
	}

	type LoginAuditResponse {
		success: Boolean!
		message: String!
		audits: [LoginAuditEntry!]!
		totalCount: Int!
	}

	type Query {
		# Admin-only: who signed in (or tried to), when, and from where.
		loginAudits(username: String, page: Int, pageSize: Int): LoginAuditResponse!
	}
`;
