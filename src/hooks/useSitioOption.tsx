import { useQuery } from "@apollo/client";
import { GET_SITIOS } from "@/graphql/sitio";
import { useState } from "react";

interface Sitio {
	id: string;
	name: string;
}

export const useSitioOptions = () => {
	const [sitios, setSitios] = useState<{ value: string; label: string }[]>([]);

	const { data, loading, error } = useQuery<any>(GET_SITIOS, {
		onCompleted: (data) => {
			if (data?.sitios?.success) {
				const sitioList = data.sitios.sitios.map((sitio: Sitio) => ({
					value: sitio.id,
					label: sitio.name,
				}));
				setSitios(sitioList);
			}
		},
		onError: (error) => {
			console.error("Failed to fetch sitios", error);
		},
	});

	return { sitios, loading };
};
