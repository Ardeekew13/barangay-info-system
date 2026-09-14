import { gql } from "graphql-tag";

export const barangayOfficialTypeDefs = gql`
	type BarangayOfficial {
		id: ID!
		resident: Resident!
		role: String!
		createdAt: String!
		updatedAt: String!
	}

	type BarangayOfficialResponse {
		success: Boolean!
		message: String!
		official: BarangayOfficial
	}

	type BarangayOfficialsResponse {
		success: Boolean!
		message: String!
		officials: [BarangayOfficial!]!
	}

	type Query {
		barangayOfficials: BarangayOfficialsResponse!
	}

	type Mutation {
		addBarangayOfficial(residentId: ID!, role: String!): BarangayOfficialResponse!
		removeBarangayOfficial(id: ID!): BarangayOfficialResponse!
	}
`;
