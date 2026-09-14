import { GET_LOGIN_AUDITS } from "@/graphql/loginAudit";
import { useQuery } from "@apollo/client";

export interface LoginAuditEntry {
  id: string;
  username: string;
  success: boolean;
  reason: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface UseLoginAuditsParams {
  username?: string;
  page?: number;
  pageSize?: number;
}

export function useLoginAudits({ username, page = 1, pageSize = 20 }: UseLoginAuditsParams) {
  const { data, loading, error, refetch } = useQuery<any>(GET_LOGIN_AUDITS, {
    variables: { username: username || undefined, page, pageSize },
    fetchPolicy: "cache-and-network",
  });

  const audits: LoginAuditEntry[] = data?.loginAudits?.audits || [];
  const totalCount: number = data?.loginAudits?.totalCount || 0;
  const notAuthorized =
    data?.loginAudits?.success === false &&
    (data?.loginAudits?.message?.includes("permission") || data?.loginAudits?.message?.includes("signed in"));

  return { audits, totalCount, loading, error, notAuthorized, refetch };
}
