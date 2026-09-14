import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useState } from "react";

const GET_HOUSEHOLD_OPTIONS = gql`
	query GetHouseholds {
		households {
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

export const useHouseholdOptions = () => {
	const [households, setHouseholds] = useState<
		{ value: string; label: string }[]
	>([]);

	const { loading, refetch } = useQuery<any>(GET_HOUSEHOLD_OPTIONS, {
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
