export interface Resident {
  id?: number;
  resident_code?: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: "Male" | "Female" | "Other";
  email: string;
  registered_voter: boolean;
  indigent: boolean;
  birthdate: string;
  purok: string;
  civil_status: "Single" | "Married" | "Widowed" | "Separated";
  occupation: string;
  employment_status: "Employed" | "Unemployed" | "Student" | "Retired" | "N/A";
  isPwd: boolean;
  status: "Active" | "Inactive" | "Deceased";
  householdId: number;
  isHead: boolean;
  is4Ps: boolean;
  isSeniorCitizen: boolean;
  isNHTS: boolean;
  isFarmer: boolean;
  sitio: {
    id: string;
    name: string;
  };
  address: string;
  place_of_birth: string;
  citizenship: string;
  indigenous_group: string;
  is_ofw: boolean;
  is_solo_parent: boolean;
  osc: boolean;
  created_at?: string;
}

export interface ResidentHousehold {
  id?: string;
  sitio?: string;
  head_of_household?: Resident;
  members?: Members[];
  parentHousehold?: { id: string; household_code: string } | null;
}
export interface Members {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  birthdate: string;
  civil_status: string;
  isHead: boolean;
}

export interface ResidentFilters {
  sitioId?: string;
  civil_status?: string;
  is_ofw?: boolean;
  is_solo_parent?: boolean;
  indigent?: boolean;
  osc?: boolean;
  isPwd?: boolean;
  registered_voter?: boolean;
  is4Ps?: boolean;
  isSeniorCitizen?: boolean;
  isNHTS?: boolean;
  isFarmer?: boolean;
}

export interface Household {
  id: number;
  household_code: string;
  head_of_household: number;
  sitio: string;
  created_at: string;
  members: Members[];
  parentHousehold?: { id: string; household_code: string } | null;
}

export interface Sitio {
  id: string;
  name: string;
}
