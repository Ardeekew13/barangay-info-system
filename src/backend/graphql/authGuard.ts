/**
 * Reusable authorization wrapper for GraphQL resolvers.
 *
 * The GraphQL context (see pages/api/graphql.ts) already carries the signed-in
 * user's { id, name, username, role } — but until now nothing actually checked
 * it before running a mutation. Wrap any resolver with requireEditor/requireAdmin
 * (or requireRole directly) and it will refuse to run for the wrong role,
 * returning the same { success, message } shape every mutation in this API
 * already returns -- so the frontend needs zero special-case handling.
 *
 * Usage:
 *   Mutation: {
 *     createSitio: requireEditor(async (_, { input }) => { ... }),
 *     deleteSitio: requireAdmin(async (_, { id }) => { ... }),
 *   }
 *
 * Role policy used across this app:
 *   - viewer  -> read-only. Every mutation is blocked.
 *   - encoder -> day-to-day data entry: create/update.
 *   - admin   -> everything, including deletes and system configuration
 *                (certificate templates, login activity).
 */

export type Role = "admin" | "encoder" | "viewer";

type ResolverFn = (parent: any, args: any, context: any, info: any) => any;

function denied(message: string, fallback: Record<string, any>) {
	return { success: false, message, ...fallback };
}

/**
 * @param allowedRoles Roles permitted to run the wrapped resolver.
 * @param resolver The actual resolver logic.
 * @param fallback Extra fields to merge into the denial response for
 *   response types that have other non-null fields besides success/message
 *   (e.g. `audits: [LoginAuditEntry!]!`). Omit for the common case where
 *   every other field on the type is nullable.
 */
export function requireRole(allowedRoles: Role[], resolver: ResolverFn, fallback: Record<string, any> = {}): ResolverFn {
	return async (parent, args, context, info) => {
		const user = context?.user;

		if (!user) {
			return denied("You must be signed in to do this.", fallback);
		}
		if (!allowedRoles.includes(user.role)) {
			return denied("You don't have permission to do this.", fallback);
		}

		return resolver(parent, args, context, info);
	};
}

/** admin + encoder — day-to-day create/update actions. */
export const requireEditor = (resolver: ResolverFn, fallback?: Record<string, any>) =>
	requireRole(["admin", "encoder"], resolver, fallback);

/** admin only — deletes and system configuration. */
export const requireAdmin = (resolver: ResolverFn, fallback?: Record<string, any>) =>
	requireRole(["admin"], resolver, fallback);
