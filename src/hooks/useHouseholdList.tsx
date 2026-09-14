import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useState } from "react";

const GET_HOUSEHOLD_OPTIONS = gql`
	query GetHouseholds($pageSize: Int) {
		households(pageSize: $pageSize) {
			success
			households {
				id
				household_code
				head_of_household {
					first_name
					last_name
					id
				}
			}
		}
	}
`;

// This feeds a plain <Select> dropdown (client-side filtered, not
// server-search-driven), so it needs every household in one shot -- the
// households query defaults to a small page for the paginated list page,
// so this explicitly asks for a high ceiling instead of relying on that
// default. If a barangay ever exceeds this many households, this dropdown
// should be switched to a search-as-you-type query instead of raising the
// number further.
const HOUSEHOLD_OPTIONS_LIMIT = 2000;

export const useHouseholdOptions = () => {
	const [households, setHouseholds] = useState<
		{ value: string; label: string }[]
	>([]);

	const { loading, refetch } = useQuery<any>(GET_HOUSEHOLD_OPTIONS, {
		variables: { pageSize: HOUSEHOLD_OPTIONS_LIMIT },
		onCompleted: (data) => {
			if (data?.households?.success) {
				const householdList = data.households.households.map(
					(household: any) => ({
						value: household.id,
						label: household.household_code,
					}),
				);
				setHouseholds(householdList);
			}
		},
		onError: (error) => {
			console.error("Failed to fetch households", error);
		},
	});

	return { households, loading, refetch };
};
