import { GET_RESIDENT_HISTORY } from "@/graphql/resident";
import { useQuery } from "@apollo/client";

export interface ResidentHistoryChange {
  field: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface ResidentHistoryEntry {
  id: string;
  action: "created" | "updated" | "deleted";
  editedByName: string | null;
  editedByUsername: string | null;
  createdAt: string;
  changes: ResidentHistoryChange[];
}

export function useResidentHistory(residentId?: string) {
  const { data, loading, error, refetch } = useQuery<any>(GET_RESIDENT_HISTORY, {
    variables: { residentId },
    skip: !residentId,
    fetchPolicy: "cache-and-network",
  });

  const history: ResidentHistoryEntry[] = data?.residentHistory?.history || [];

  return { history, loading, error, refetch };
}
