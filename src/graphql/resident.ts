import { gql } from "@apollo/client";

// QUERIES
export const GET_RESIDENTS = gql`
  query GetResidents($filters: ResidentFilters, $search: String, $page: Int, $pageSize: Int) {
    residents(filters: $filters, search: $search, page: $page, pageSize: $pageSize) {
      success
      message
      totalCount
      residents {
        id
        resident_code
        first_name
        middle_name
        last_name
        email
        birthdate
        place_of_birth
        address
        gender
        sitio {
          id
          name
        }
        civil_status
        occupation
        employment_status
        citizenship
        indigenous_group
        registered_voter
        is_ofw
        is_solo_parent
        osc
        indigent
        isPwd
        status
        isHead
        is4Ps
        isSeniorCitizen
        isNHTS
        isFarmer
        householdId
        createdAt
        updatedAt
      }
    }
  }
`;


export const GET_RESIDENT = gql`
  query GetResident($id: ID!) {
    resident(id: $id) {
      success
      message
      resident {
        id
        resident_code
        first_name
        middle_name
        last_name
        email
        birthdate
        place_of_birth
        address
        gender
        sitio {
          id
          name
        }
        civil_status
        occupation
        employment_status
        citizenship
        indigenous_group
        registered_voter
        is_ofw
        is_solo_parent
        osc
        indigent
        isPwd
        status
        isHead
        is4Ps
        isSeniorCitizen
        isNHTS
        isFarmer
        householdId
        household {
          id
          household_code
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_RESIDENTS_HEAD = gql`
  query GetResidentsHead($search: String) {
    headResidents(search: $search) {
      success
      message
      residents {
        id
        resident_code
        first_name
        middle_name
        last_name
        email
        birthdate
        place_of_birth
        address
        gender
        sitio {
          id
          name
        }
        civil_status
        occupation
        employment_status
        citizenship
        indigenous_group
        registered_voter
        is_ofw
        is_solo_parent
        osc
        indigent
        isPwd
        status
        isHead
        is4Ps
        isSeniorCitizen
        isNHTS
        isFarmer
        householdId
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_RESIDENTS_WITHOUT_HOUSEHOLD = gql`
  query GetResidentsWithoutHousehold($search: String) {
    getResidentWithoutHousehold(search: $search) {
      success
      message
      residents {
        id
        resident_code
        first_name
        middle_name
        last_name
        email
        birthdate
        place_of_birth
        address
        gender
        sitio {
          id
          name
        }
        civil_status
        occupation
        employment_status
        citizenship
        indigenous_group
        registered_voter
        is_ofw
        is_solo_parent
        osc
        indigent
        isPwd
        status
        isHead
        is4Ps
        isSeniorCitizen
        isNHTS
        isFarmer
        householdId
        createdAt
        updatedAt
      }
    }
  }
`;
export const GET_POPULATION_REPORT = gql`
  query GetPopulationReport {
    populationReport {
      success
      message
      report {
        totalInhabitants
        totalMale
        totalFemale
        totalHouseholds
        totalFamilies
        total4Ps
        totalSeniors
        totalFarmers
        ageBrackets {
          indicator
          male
          female
          total
        }
        sectors {
          indicator
          male
          female
          total
        }
        civilStatus {
          indicator
          male
          female
          total
        }
        citizenship {
          indicator
          male
          female
          total
        }
        seniorCitizens {
          id
          resident_code
          name
          age
          gender
          sitio
          address
        }
      }
    }
  }
`;

export const GET_RESIDENT_HISTORY = gql`
  query GetResidentHistory($residentId: ID!) {
    residentHistory(residentId: $residentId) {
      success
      message
      history {
        id
        action
        editedByName
        editedByUsername
        createdAt
        changes {
          field
          label
          oldValue
          newValue
        }
      }
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      success
      message
      stats {
        totalHouseholds
        totalPopulation
        totalFamilies
      }
    }
  }
`;

// MUTATIONS
export const CREATE_RESIDENT = gql`
  mutation CreateResident($input: ResidentInput!) {
    createResident(input: $input) {
      success
      message
      id
    }
  }
`;

export const UPDATE_RESIDENT = gql`
  mutation UpdateResident($id: ID!, $input: ResidentInput!) {
    updateResident(id: $id, input: $input) {
      success
      message
      id
    }
  }
`;

export const DELETE_RESIDENT = gql`
  mutation DeleteResident($id: ID!) {
    deleteResident(id: $id) {
      success
      message
      id
    }
  }
`;
