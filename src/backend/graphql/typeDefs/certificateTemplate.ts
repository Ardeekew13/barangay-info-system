import { gql } from "graphql-tag";

export const certificateTemplateTypeDefs = gql`
	type Placeholder {
		key: String!
		label: String!
		source: String!
		type: String!
		required: Boolean!
		options: [String!]
	}

	input PlaceholderInput {
		key: String!
		label: String!
		source: String!
		type: String
		required: Boolean
		options: [String!]
	}

	type CertificateTemplate {
		id: ID!
		key: String!
		name: String!
		category: String!
		description: String
		placeholders: [Placeholder!]!
		version: Int!
		isActive: Boolean!
		createdAt: String!
		updatedAt: String!
	}

	type CertificateTemplatesResponse {
		success: Boolean!
		message: String!
		templates: [CertificateTemplate!]!
	}

	type CertificateTemplateResponse {
		success: Boolean!
		message: String!
		template: CertificateTemplate
	}

	type DeleteCertificateTemplateResponse {
		success: Boolean!
		message: String!
	}

	type Query {
		certificateTemplates(activeOnly: Boolean): CertificateTemplatesResponse!
		certificateTemplate(key: String!): CertificateTemplateResponse!
	}

	type Mutation {
		updateCertificateTemplatePlaceholders(key: String!, placeholders: [PlaceholderInput!]!): CertificateTemplateResponse!
		setCertificateTemplateActive(key: String!, isActive: Boolean!): CertificateTemplateResponse!
		deleteCertificateTemplate(key: String!): DeleteCertificateTemplateResponse!
	}
`;
