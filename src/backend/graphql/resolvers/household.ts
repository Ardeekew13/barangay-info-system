import Household from "../../models/Household";
import Resident from "../../models/Resident";
import mongoose from "mongoose";
import { requireAdmin, requireEditor } from "../authGuard";

export const householdResolvers = {
	Household: {
		id: (parent: any) => parent.id || parent._id,

		sitio: async (parent: any) => {
			if (
				parent.sitio &&
				typeof parent.sitio === "object" &&
				parent.sitio.name
			) {
				return {
					id: parent.sitio.id || parent.sitio._id,
					name: parent.sitio.name,
				};
			}
			const { default: Sitio } = await import("../../models/Sitio");
			const sitio = await Sitio.findById(parent.sitio);
			return sitio ? { id: sitio._id, name: sitio.name } : null;
		},

		head_of_household: async (parent: any) => {
			try {
				const householdId = parent._id || parent.id;
				if (parent._residents) {
					return parent._residents.find((r: any) => r.isHead) || null;
				}
				return await Resident.findOne({
					householdId,
					isHead: true,
					isDeleted: { $ne: true },
				}).populate("sitio");
			} catch (error: any) {
				console.error("Error fetching head:", error);
				return null;
			}
		},

		members: async (parent: any) => {
			try {
				if (parent._residents) return parent._residents;
				return await Resident.find({
					householdId: parent._id,
					isDeleted: { $ne: true },
				}).populate("sitio");
			} catch (error: any) {
				console.error("Error fetching members:", error);
				return [];
			}
		},

		parentHousehold: async (parent: any) => {
			try {
				if (!parent.parentHouseholdId) return null;
				return await Household.findById(parent.parentHouseholdId).populate(
					"sitio",
				);
			} catch (error: any) {
				console.error("Error fetching parent household:", error);
				return null;
			}
		},
	},

	Query: {
		households: async (
			_: any,
			{ search, page, pageSize }: { search?: string; page?: number; pageSize?: number },
		) => {
			try {
				const query: any = {};
				if (search) {
					query.household_code = { $regex: search, $options: "i" };
				}

				const totalCount = await Household.countDocuments(query);
				const currentPage = page && page > 0 ? page : 1;
				const limit = pageSize && pageSize > 0 ? pageSize : 10;
				const skip = (currentPage - 1) * limit;

				const households = await Household.find(query)
					.populate("sitio")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit);

				const householdIds = households.map((hh) => hh._id);

				const residents = await Resident.find({
					householdId: { $in: householdIds },
					isDeleted: { $ne: true },
				}).populate("sitio");

				const result = households.map((hh) => {
					const hhObj = hh.toObject();

					const members = residents.filter(
						(r) => r.householdId?.toString() === hh._id.toString(),
					);

					const head = members.find((r) => r.isHead);

					return {
						...hhObj,

						head_of_household: head || null,

						members,
					};
				});

				return {
					success: true,
					message: "Households fetched successfully",
					households: result,
					totalCount,
				};
			} catch (error: any) {
				return {
					success: false,
					message: `Failed to fetch households: ${error.message}`,
					households: [],
					totalCount: 0,
				};
			}
		},

		household: async (_: any, { id }: { id: string }) => {
			try {
				const household = await Household.findById(id).populate("sitio");
				if (!household) {
					return {
						success: false,
						message: "Household not found",
						household: null,
					};
				}

				const members = await Resident.find({
					householdId: id,
					isDeleted: { $ne: true },
				}).populate("sitio");
				const hhObject = household.toObject();
				hhObject._residents = members;
				return {
					success: true,
					message: "Household fetched successfully",
					household: hhObject,
				};
			} catch (error: any) {
				return {
					success: false,
					message: `Failed: ${error.message}`,
					household: null,
				};
			}
		},

		householdsBySitio: async (_: any, { sitioId }: { sitioId: string }) => {
			try {
				const households = await Household.find({ sitio: sitioId })
					.populate("sitio")
					.sort({ createdAt: -1 });

				const householdIds = households.map((hh) => hh._id);
				const allResidents = await Resident.find({
					householdId: { $in: householdIds },
					isDeleted: { $ne: true },
				}).populate("sitio");

				const householdsWithMembers = households.map((hh) => {
					const hhObject = hh.toObject();
					hhObject._residents = allResidents.filter(
						(r) => r.householdId?.toString() === hh._id.toString(),
					);
					return hhObject;
				});

				return {
					success: true,
					message: "Households fetched successfully",
					households: householdsWithMembers,
				};
			} catch (error: any) {
				return {
					success: false,
					message: `Failed: ${error.message}`,
					households: [],
				};
			}
		},
	},

	Mutation: {
		saveHousehold: requireEditor(async (
			_: any,
			{ id, input }: { id?: string; input: any },
		) => {
			try {
				// A household can optionally be marked as being "under" another household --
				// e.g. a married child's own family that still lives in the parents' house.
				// Guard against a household referencing itself, and against a two-household
				// loop (A under B, B under A).
				if (input.parentHouseholdId) {
					if (id && input.parentHouseholdId === id) {
						throw new Error("A household can't be placed under itself.");
					}
					const parent = await Household.findById(input.parentHouseholdId);
					if (!parent) throw new Error("The selected parent household was not found.");
					if (id && parent.parentHouseholdId?.toString() === id) {
						throw new Error(
							"That household is already placed under this one -- pick a different parent household.",
						);
					}
				}

				let household;
				const isUpdate = !!id;

				if (isUpdate) {
					household = await Household.findByIdAndUpdate(
						id,
						{
							sitio: input.sitioId,
							parentHouseholdId: input.parentHouseholdId || null,
						},
						{ new: true, runValidators: true },
					).populate("sitio");
					if (!household) throw new Error("Household not found");
				} else {
					const lastHousehold = await Household.findOne().sort({
						household_code: -1,
					});
					const lastNum = lastHousehold
						? parseInt(lastHousehold.household_code.replace("HH-", ""), 10)
						: 0;
					const household_code = `HH-${String(lastNum + 1).padStart(5, "0")}`;

					household = await new Household({
						sitio: input.sitioId,
						household_code,
						parentHouseholdId: input.parentHouseholdId || null,
					}).save();
					household = await Household.findById(household._id).populate("sitio");
				}

				const householdId = household!._id;

				// Sync members: set householdId for all provided members
				if (input.membersIds && input.membersIds.length > 0) {
					// Check if any member belongs to a DIFFERENT household
					const conflicting = await Resident.find({
						_id: { $in: input.membersIds },
						householdId: { $ne: null, $nin: [householdId] },
					});
					if (conflicting.length > 0) {
						const names = conflicting
							.map((m) => `${m.first_name} ${m.last_name}`)
							.join(", ");
						throw new Error(
							`These residents already belong to another household: ${names}`,
						);
					}

					// Assign all members to this household
					await Resident.updateMany(
						{ _id: { $in: input.membersIds } },
						{ householdId },
					);
				}

				// Handle head of household
				if (input.headResidentId) {
					await Resident.updateMany(
						{ householdId, isHead: true },
						{ isHead: false },
					);
					await Resident.updateOne(
						{ _id: input.headResidentId },
						{ isHead: true },
					);
				}

				return {
					success: true,
					message: isUpdate
						? "Household updated successfully"
						: "Household created successfully",
					household,
				};
			} catch (error: any) {
				return {
					success: false,
					message: error.message || "Failed to save household",
					household: null,
				};
			}
		}),

		deleteHousehold: requireAdmin(async (_: any, { id }: { id: string }) => {
			try {
				const household = await Household.findById(id);
				if (!household) throw new Error("Household not found");

				await Resident.updateMany(
					{ householdId: id },
					{ householdId: null, isHead: false },
				);
				// Any household placed "under" this one loses that link rather than
				// pointing at a deleted household.
				await Household.updateMany(
					{ parentHouseholdId: id },
					{ parentHouseholdId: null },
				);
				await Household.findByIdAndDelete(id);

				return {
					success: true,
					message: "Household deleted successfully",
					household: null,
				};
			} catch (error: any) {
				return {
					success: false,
					message: error.message || "Failed to delete household",
					household: null,
				};
			}
		}),

		deleteHouseholdMember: requireEditor(async (
			_: any,
			{ residentId }: { residentId: string },
		) => {
			try {
				const resident = await Resident.findById(residentId);
				if (!resident) {
					return {
						success: false,
						message: "Resident not found",
						household: null,
					};
				}
				if (resident.isHead) {
					return {
						success: false,
						message:
							"Cannot remove the head of household. Change the head first.",
						household: null,
					};
				}
				await Resident.updateOne({ _id: residentId }, { householdId: null });
				return {
					success: true,
					message: "Member removed successfully",
					household: null,
				};
			} catch (error: any) {
				return {
					success: false,
					message: error.message || "Failed to remove member",
					household: null,
				};
			}
		}),

		addMembersToHousehold: requireEditor(async (
			_: any,
			{ householdId, memberIds }: { householdId: string; memberIds: string[] },
		) => {
			try {
				const household = await Household.findById(householdId);
				if (!household) throw new Error("Household not found");

				const residents = await Resident.find({ _id: { $in: memberIds } });
				if (residents.length !== memberIds.length) {
					throw new Error("One or more residents not found");
				}

				const alreadyAssigned = residents.filter((r) => r.householdId != null);
				if (alreadyAssigned.length > 0) {
					const names = alreadyAssigned
						.map((r) => `${r.first_name} ${r.last_name}`)
						.join(", ");
					throw new Error(
						`These residents already belong to a household: ${names}`,
					);
				}

				await Resident.updateMany(
					{ _id: { $in: memberIds } },
					{ householdId: household._id },
				);

				const updatedHousehold =
					await Household.findById(householdId).populate("sitio");
				const members = await Resident.find({
					householdId,
					isDeleted: { $ne: true },
				}).populate("sitio");
				const hhObject = updatedHousehold!.toObject();
				hhObject._residents = members;

				return {
					success: true,
					message: "Members added successfully",
					household: hhObject,
				};
			} catch (error: any) {
				return {
					success: false,
					message: error.message || "Failed to add members",
					household: null,
				};
			}
		}),
	},
};
