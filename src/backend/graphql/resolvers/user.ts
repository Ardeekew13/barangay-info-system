import User from "@/backend/models/User";
import { requireAdmin } from "@/backend/graphql/authGuard";

const ALLOWED_ROLES = ["admin", "encoder", "viewer"];

function serializeUser(user: any) {
	return {
		id: user._id,
		username: user.username,
		name: user.name,
		role: user.role,
		isActive: user.isActive,
		createdAt: user.createdAt.toISOString(),
		updatedAt: user.updatedAt.toISOString(),
	};
}

export const userResolvers = {
	Query: {
		// Account management is admin-only, same as Login Activity -- the
		// { users: [] } fallback satisfies the non-null list field for a
		// denied/logged-out request.
		users: requireAdmin(async (_: any, { search }: { search?: string }) => {
			try {
				const query: any = {};
				if (search) {
					query.$or = [
						{ username: { $regex: search, $options: "i" } },
						{ name: { $regex: search, $options: "i" } },
					];
				}

				const users = await User.find(query).sort({ createdAt: -1 });

				return {
					success: true,
					message: "Accounts fetched successfully",
					users: users.map(serializeUser),
				};
			} catch (error: any) {
				return { success: false, message: `Failed to fetch accounts: ${error.message}`, users: [] };
			}
		}, { users: [] }),
	},

	Mutation: {
		createUserAccount: requireAdmin(async (
			_: any,
			{ input }: { input: { username: string; name: string; password: string; role: string } },
		) => {
			try {
				if (!ALLOWED_ROLES.includes(input.role)) {
					return { success: false, message: "Invalid role.", user: null };
				}
				if (input.password.length < 8) {
					return { success: false, message: "Password must be at least 8 characters.", user: null };
				}

				const user = new User({
					username: input.username.trim().toLowerCase(),
					name: input.name.trim(),
					password: input.password, // hashed by the User model's pre-save hook
					role: input.role,
				});
				await user.save();

				return { success: true, message: "Account created successfully", user: serializeUser(user) };
			} catch (error: any) {
				if (error.code === 11000) {
					return { success: false, message: "That username is already taken.", user: null };
				}
				return { success: false, message: `Failed to create account: ${error.message}`, user: null };
			}
		}),

		updateUserAccount: requireAdmin(async (
			_: any,
			{ id, input }: { id: string; input: { name?: string; role?: string; isActive?: boolean } },
			context: any,
		) => {
			try {
				if (input.role && !ALLOWED_ROLES.includes(input.role)) {
					return { success: false, message: "Invalid role.", user: null };
				}

				// Never let an admin lock themselves out via this screen -- changing
				// your own role away from admin or deactivating your own account.
				const isSelf = String(context?.user?.id) === String(id);
				if (isSelf && (input.role !== undefined || input.isActive !== undefined)) {
					return {
						success: false,
						message: "You can't change your own role or active status here.",
						user: null,
					};
				}

				const update: Record<string, any> = {};
				if (input.name !== undefined) update.name = input.name.trim();
				if (input.role !== undefined) update.role = input.role;
				if (input.isActive !== undefined) update.isActive = input.isActive;

				const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
				if (!user) {
					return { success: false, message: "Account not found", user: null };
				}

				return { success: true, message: "Account updated successfully", user: serializeUser(user) };
			} catch (error: any) {
				return { success: false, message: `Failed to update account: ${error.message}`, user: null };
			}
		}),

		resetUserAccountPassword: requireAdmin(async (
			_: any,
			{ id, newPassword }: { id: string; newPassword: string },
		) => {
			try {
				if (newPassword.length < 8) {
					return { success: false, message: "Password must be at least 8 characters.", user: null };
				}

				const user = await User.findById(id);
				if (!user) {
					return { success: false, message: "Account not found", user: null };
				}

				user.password = newPassword; // re-hashed by the pre-save hook
				user.failedLoginAttempts = 0;
				user.lockUntil = null;
				await user.save();

				return { success: true, message: "Password reset successfully", user: serializeUser(user) };
			} catch (error: any) {
				return { success: false, message: `Failed to reset password: ${error.message}`, user: null };
			}
		}),
	},
};
