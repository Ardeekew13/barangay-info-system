import { gql } from "@apollo/client";

export const GET_BARANGAY_OFFICIALS = gql`
  query GetBarangayOfficials {
    barangayOfficials {
      success
      message
      officials {
        id
        role
        resident {
          id
          resident_code
          first_name
          middle_name
          last_name
          sitio {
            id
            name
          }
        }
        createdAt
      }
    }
  }
`;

export const ADD_BARANGAY_OFFICIAL = gql`
  mutation AddBarangayOfficial($residentId: ID!, $role: String!) {
    addBarangayOfficial(residentId: $residentId, role: $role) {
      success
      message
      official {
        id
        role
        resident {
          id
          first_name
          middle_name
          last_name
        }
      }
    }
  }
`;

export const REMOVE_BARANGAY_OFFICIAL = gql`
  mutation RemoveBarangayOfficial($id: ID!) {
    removeBarangayOfficial(id: $id) {
      success
      message
    }
  }
`;
