import { useQuery } from "@apollo/client";
import { GET_OCCUPATIONS } from "@/graphql/occupation";
import { useState } from "react";

interface Occupation {
	id: string;
	name: string;
}

export const useOccupationOptions = () => {
	const [occupations, setOccupations] = useState<{ value: string; label: string }[]>([]);

	const { data, loading, error, refetch } = useQuery<any>(GET_OCCUPATIONS, {
		fetchPolicy: "cache-and-network",
		onCompleted: (data) => {
			if (data?.occupations?.success) {
				const occupationList = data.occupations.occupations.map((occupation: Occupation) => ({
					value: occupation.name,
					label: occupation.name,
				}));
				setOccupations(occupationList);
			}
		},
		onError: (error) => {
			console.error("Failed to fetch occupations", error);
		},
	});

	return { occupations, loading, refetch };
};
