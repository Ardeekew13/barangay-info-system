import LoginAudit from "@/backend/models/LoginAudit";
import { requireAdmin } from "@/backend/graphql/authGuard";

export const loginAuditResolvers = {
	Query: {
		// Login activity is sensitive — only admins can view it. The
		// { audits: [], totalCount: 0 } fallback satisfies this type's
		// non-null list/int fields if a non-admin (or logged-out request)
		// somehow reaches this resolver.
		loginAudits: requireAdmin(async (
			_: any,
			{ username, page, pageSize }: { username?: string; page?: number; pageSize?: number },
		) => {
			try {
				const query: any = {};
				if (username) {
					query.username = { $regex: username, $options: "i" };
				}

				const totalCount = await LoginAudit.countDocuments(query);
				const currentPage = page && page > 0 ? page : 1;
				const limit = pageSize && pageSize > 0 ? pageSize : 20;
				const skip = (currentPage - 1) * limit;

				const audits = await LoginAudit.find(query)
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit);

				return {
					success: true,
					message: "Login audit log fetched successfully",
					totalCount,
					audits: audits.map((a: any) => ({
						id: a._id,
						username: a.username,
						success: a.success,
						reason: a.reason,
						ip: a.ip,
						userAgent: a.userAgent,
						createdAt: a.createdAt.toISOString(),
					})),
				};
			} catch (error: any) {
				return { success: false, message: `Failed to fetch login audit log: ${error.message}`, audits: [], totalCount: 0 };
			}
		}, { audits: [], totalCount: 0 }),
	},
};
