import { gql } from "graphql-tag";

export const residentTypeDefs = gql`
	# Response for single resident query
	type ResidentResponse {
		success: Boolean!
		message: String!
		resident: Resident
	}

	# Response for list of residents query
	type ResidentsResponse {
		success: Boolean!
		message: String!
		residents: [Resident!]
		totalCount: Int!
	}

	# Response for mutations (create/update/delete)
	type MutationResponse {
		success: Boolean!
		message: String!
		id: ID
	}

	type Resident {
		id: ID!
		resident_code: String!
		first_name: String!
		middle_name: String!
		last_name: String!
		email: String
		birthdate: String!
		place_of_birth: String!
		address: String!
		gender: String!
		sitio: Sitio!
		civil_status: String!
		occupation: String!
		employment_status: String
		citizenship: String!
		indigenous_group: String!
		registered_voter: Boolean!
		is_ofw: Boolean!
		is_solo_parent: Boolean!
		osc: Boolean!
		indigent: Boolean!
		isPwd: Boolean!
		status: String!
		isHead: Boolean!
		is4Ps: Boolean!
		isSeniorCitizen: Boolean!
		isNHTS: Boolean!
		isFarmer: Boolean!
		householdId: ID # Optional - resident may not belong to a household yet
		household: Household
		createdAt: String!
		updatedAt: String!
	}

	type PopulationStat {
		indicator: String!
		male: Int!
		female: Int!
		total: Int!
	}

	type SeniorCitizen {
		id: ID!
		resident_code: String!
		name: String!
		age: Int!
		gender: String!
		sitio: String!
		address: String!
	}

	type PopulationReportData {
		totalInhabitants: Int!
		totalMale: Int!
		totalFemale: Int!
		totalHouseholds: Int!
		totalFamilies: Int!
		total4Ps: Int!
		totalSeniors: Int!
		totalFarmers: Int!
		ageBrackets: [PopulationStat!]!
		sectors: [PopulationStat!]!
		civilStatus: [PopulationStat!]!
		citizenship: [PopulationStat!]!
		seniorCitizens: [SeniorCitizen!]!
	}

	type PopulationReportResponse {
		success: Boolean!
		message: String!
		report: PopulationReportData
	}

	type DashboardStats {
		totalHouseholds: Int!
		totalPopulation: Int!
		totalFamilies: Int!
	}

	type DashboardStatsResponse {
		success: Boolean!
		message: String!
		stats: DashboardStats
	}

	# A single field change within an "updated" history entry
	type ResidentHistoryChange {
		field: String!
		label: String!
		oldValue: String
		newValue: String
	}

	type ResidentHistoryEntry {
		id: ID!
		action: String!
		changes: [ResidentHistoryChange!]!
		editedByName: String
		editedByUsername: String
		createdAt: String!
	}

	type ResidentHistoryResponse {
		success: Boolean!
		message: String!
		history: [ResidentHistoryEntry!]!
	}

	type Query {
		# Get all residents with optional filters and search
		residents(filters: ResidentFilters, search: String, page: Int, pageSize: Int): ResidentsResponse!
		headResidents(search: String): ResidentsResponse!
		getResidentWithoutHousehold(search: String): ResidentsResponse!
		# Get single resident by ID
		resident(id: ID!): ResidentResponse!
		# Get edit history for a resident (who changed what, and when)
		residentHistory(residentId: ID!): ResidentHistoryResponse!
		# Get population report data
		populationReport: PopulationReportResponse!
		# Get dashboard summary stats
		dashboardStats: DashboardStatsResponse!
	}

	type Mutation {
		createResident(input: ResidentInput!): MutationResponse!
		updateResident(id: ID!, input: ResidentInput!): MutationResponse!
		deleteResident(id: ID!): MutationResponse!
	}

	input ResidentInput {
		first_name: String!
		middle_name: String!
		last_name: String!
		email: String
		birthdate: String!
		place_of_birth: String!
		address: String!
		gender: String!
		sitioId: ID!
		civil_status: String!
		occupation: String!
		employment_status: String!
		citizenship: String!
		indigenous_group: String!
		registered_voter: Boolean
		is_ofw: Boolean
		is_solo_parent: Boolean
		osc: Boolean
		indigent: Boolean
		isPwd: Boolean
		status: String!
		isHead: Boolean
		is4Ps: Boolean
		isSeniorCitizen: Boolean
		isNHTS: Boolean
		isFarmer: Boolean
		householdId: ID
		memberIds: [ID!]
	}

	input ResidentFilters {
		sitioId: ID
		civil_status: String
		is_ofw: Boolean
		is_solo_parent: Boolean
		indigent: Boolean
		osc: Boolean
		isPwd: Boolean
		registered_voter: Boolean
		is4Ps: Boolean
		isSeniorCitizen: Boolean
		isNHTS: Boolean
		isFarmer: Boolean
	}
`;
