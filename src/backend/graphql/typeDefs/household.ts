import { gql } from "graphql-tag";

export const householdTypeDefs = gql`
	type HouseholdResponse {
		success: Boolean!
		message: String!
		household: Household
	}

	type HouseholdsResponse {
		success: Boolean!
		message: String!
		households: [Household!]
		totalCount: Int
	}

	type Household {
		id: ID!
		household_code: String!
		sitio: Sitio!
		head_of_household: Resident
		members: [Resident!]!
		parentHousehold: Household
		createdAt: String!
		updatedAt: String!
	}

	type Query {
		households(search: String, page: Int, pageSize: Int): HouseholdsResponse!
		household(id: ID!): HouseholdResponse!
		householdsBySitio(sitioId: ID!): HouseholdsResponse!
	}

	type Mutation {
		saveHousehold(id: ID, input: HouseholdInput!): HouseholdResponse!
		deleteHousehold(id: ID!): HouseholdResponse!
		deleteHouseholdMember(residentId: ID!): HouseholdResponse!
		addMembersToHousehold(
			householdId: ID!
			memberIds: [ID!]!
		): HouseholdResponse!
	}

	input HouseholdInput {
		sitioId: ID!
		membersIds: [ID!]
		headResidentId: ID
		parentHouseholdId: ID
	}
`;
