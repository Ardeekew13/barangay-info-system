import { useQuery } from "@apollo/client";
import { GET_RESIDENTS, GET_RESIDENTS_HEAD } from "@/graphql/resident";
import { useState } from "react";

interface Resident {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
}

export const useResidentOptions = () => {
  const [residents, setResidents] = useState<
    { value: string; label: string }[]
  >([]);

  const { data, loading, error } = useQuery<any>(GET_RESIDENTS_HEAD, {
    onCompleted: (data) => {
      if (data?.headResidents?.success) {
        const residentList = data.headResidents.residents.map(
          (resident: Resident) => ({
            value: resident.id,
            label: `${resident.first_name} ${resident.middle_name} ${resident.last_name}`,
          }),
        );
        setResidents(residentList);
      }
    },
    onError: (error) => {
      console.error("Failed to fetch residents", error);
    },
  });

  return { residents, loading };
};
