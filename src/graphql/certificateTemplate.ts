import { gql } from "@apollo/client";

export const GET_CERTIFICATE_TEMPLATES = gql`
  query GetCertificateTemplates($activeOnly: Boolean) {
    certificateTemplates(activeOnly: $activeOnly) {
      success
      message
      templates {
        id
        key
        name
        category
        description
        version
        isActive
        createdAt
        updatedAt
        placeholders {
          key
          label
          source
          type
          required
          options
        }
      }
    }
  }
`;

export const UPDATE_CERTIFICATE_TEMPLATE_PLACEHOLDERS = gql`
  mutation UpdateCertificateTemplatePlaceholders($key: String!, $placeholders: [PlaceholderInput!]!) {
    updateCertificateTemplatePlaceholders(key: $key, placeholders: $placeholders) {
      success
      message
      template {
        id
        key
        placeholders {
          key
          label
          source
          type
          required
          options
        }
      }
    }
  }
`;

export const SET_CERTIFICATE_TEMPLATE_ACTIVE = gql`
  mutation SetCertificateTemplateActive($key: String!, $isActive: Boolean!) {
    setCertificateTemplateActive(key: $key, isActive: $isActive) {
      success
      message
      template {
        id
        key
        isActive
      }
    }
  }
`;

export const DELETE_CERTIFICATE_TEMPLATE = gql`
  mutation DeleteCertificateTemplate($key: String!) {
    deleteCertificateTemplate(key: $key) {
      success
      message
    }
  }
`;
