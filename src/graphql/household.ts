import { gql } from "@apollo/client";

// QUERIES
export const GET_HOUSEHOLDS = gql`
  query GetHouseholds($search: String, $page: Int, $pageSize: Int) {
    households(search: $search, page: $page, pageSize: $pageSize) {
      success
      message
      totalCount
      households {
        id
        household_code
        sitio {
          id
          name
        }
        head_of_household {
          id
          first_name
          middle_name
          last_name
          resident_code
        }
        members {
          id
          first_name
          middle_name
          last_name
          isHead
          resident_code
          birthdate
        }
        parentHousehold {
          id
          household_code
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_HOUSEHOLD = gql`
  query GetHousehold($id: ID!) {
    household(id: $id) {
      success
      message
      household {
        id
        household_code
        sitio {
          id
          name
        }
        head_of_household {
          id
          first_name
          middle_name
          last_name
        }
        members {
          id
          first_name
          middle_name
          last_name
          isHead
        }
        parentHousehold {
          id
          household_code
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_HOUSEHOLDS_BY_SITIO = gql`
  query GetHouseholdsBySitio($sitioId: ID!) {
    householdsBySitio(sitioId: $sitioId) {
      success
      message
      households {
        id
        household_code
        sitio {
          id
          name
        }
        head_of_household {
          id
          first_name
          middle_name
          last_name
        }
        createdAt
      }
    }
  }
`;

// MUTATIONS
export const SAVE_HOUSEHOLD = gql`
  mutation SaveHousehold($id: ID, $input: HouseholdInput!) {
    saveHousehold(id: $id, input: $input) {
      success
      message
      household {
        id
        household_code
        sitio {
          id
          name
        }
        parentHousehold {
          id
          household_code
        }
      }
    }
  }
`;

export const CREATE_HOUSEHOLD = gql`
  mutation CreateHousehold($input: HouseholdInput!) {
    createHousehold(input: $input) {
      success
      message
      household {
        id
        household_code
        sitio {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_HOUSEHOLD = gql`
  mutation UpdateHousehold($id: ID!, $input: HouseholdInput!) {
    updateHousehold(id: $id, input: $input) {
      success
      message
      household {
        id
        household_code
      }
    }
  }
`;

export const DELETE_HOUSEHOLD = gql`
  mutation DeleteHousehold($id: ID!) {
    deleteHousehold(id: $id) {
      success
      message
    }
  }
`;

export const DELETE_HOUSEHOLD_MEMBER = gql`
  mutation DeleteHouseholdMember($residentId: ID!) {
    deleteHouseholdMember(residentId: $residentId) {
      success
      message
    }
  }
`;

export const ADD_MEMBERS_TO_HOUSEHOLD = gql`
  mutation AddMembersToHousehold($householdId: ID!, $memberIds: [ID!]!) {
    addMembersToHousehold(householdId: $householdId, memberIds: $memberIds) {
      success
      message
      household {
        id
        household_code
        sitio {
          id
          name
        }
        head_of_household {
          id
          first_name
          middle_name
          last_name
        }
        members {
          id
          first_name
          middle_name
          last_name
          isHead
          resident_code
          birthdate
        }
      }
    }
  }
`;

