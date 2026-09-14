import BarangayOfficial from "../../models/BarangayOfficial";
import Resident from "../../models/Resident";
import { requireAdmin, requireEditor } from "../authGuard";

const ROLE_LIMITS: Record<string, number> = {
	"Punong Barangay": 1,
	"Barangay Kagawad": 7,
	"SK Chairperson": 1,
	"Barangay Secretary": 1,
	"Barangay Treasurer": 1,
};

export const barangayOfficialResolvers = {
	BarangayOfficial: {
		id: (parent: any) => parent.id || parent._id,
		resident: async (parent: any) => {
			if (parent.residentId && typeof parent.residentId === "object" && parent.residentId.first_name) {
				return parent.residentId;
			}
			return await Resident.findById(parent.residentId).populate("sitio");
		},
	},

	Query: {
		barangayOfficials: async () => {
			try {
				const officials = await BarangayOfficial.find()
					.populate({ path: "residentId", populate: { path: "sitio" } })
					.sort({ createdAt: -1 });
				return { success: true, message: "Officials fetched successfully", officials };
			} catch (error: any) {
				return { success: false, message: error.message, officials: [] };
			}
		},
	},

	Mutation: {
		addBarangayOfficial: requireEditor(async (_: any, { residentId, role }: { residentId: string; role: string }) => {
			try {
				const limit = ROLE_LIMITS[role];
				if (limit === undefined) throw new Error("Invalid role");

				const currentCount = await BarangayOfficial.countDocuments({ role });
				if (currentCount >= limit) {
					throw new Error(`Cannot add more. Maximum of ${limit} ${role} allowed.`);
				}

				// Check if resident is already an official
				const existing = await BarangayOfficial.findOne({ residentId });
				if (existing) {
					throw new Error("This resident is already assigned as an official.");
				}

				const resident = await Resident.findById(residentId);
				if (!resident) throw new Error("Resident not found");

				const official = new BarangayOfficial({ residentId, role });
				await official.save();

				const populated = await BarangayOfficial.findById(official._id)
					.populate({ path: "residentId", populate: { path: "sitio" } });

				return { success: true, message: "Official added successfully", official: populated };
			} catch (error: any) {
				return { success: false, message: error.message || "Failed to add official", official: null };
			}
		}),

		removeBarangayOfficial: requireAdmin(async (_: any, { id }: { id: string }) => {
			try {
				const official = await BarangayOfficial.findById(id);
				if (!official) throw new Error("Official not found");

				await BarangayOfficial.findByIdAndDelete(id);
				return { success: true, message: "Official removed successfully", official: null };
			} catch (error: any) {
				return { success: false, message: error.message || "Failed to remove official", official: null };
			}
		}),
	},
};
