import Resident from "@/backend/models/Resident";
import Household from "@/backend/models/Household";
import Sitio from "@/backend/models/Sitio";
import ResidentHistory from "@/backend/models/ResidentHistory";
import { requireAdmin, requireEditor } from "@/backend/graphql/authGuard";

// Human-readable labels for the fields we track in the history log.
// Only fields present here get recorded when they change.
const FIELD_LABELS: Record<string, string> = {
	first_name: "First Name",
	middle_name: "Middle Name",
	last_name: "Last Name",
	email: "Email",
	birthdate: "Birthdate",
	place_of_birth: "Place of Birth",
	address: "Address",
	gender: "Gender",
	sitio: "Sitio",
	civil_status: "Civil Status",
	occupation: "Occupation",
	employment_status: "Employment Status",
	citizenship: "Citizenship",
	indigenous_group: "Indigenous Group",
	registered_voter: "Registered Voter",
	is_ofw: "OFW",
	is_solo_parent: "Solo Parent",
	osc: "Out of School Child/Youth",
	indigent: "Indigent",
	isPwd: "PWD",
	status: "Status",
	isHead: "Head of Household",
	is4Ps: "4Ps Beneficiary",
	isSeniorCitizen: "Senior Citizen",
	isNHTS: "NHTS",
	isFarmer: "Farmer",
	householdId: "Household",
};

function getEditorSnapshot(context: any) {
	const user = context?.user;
	if (!user) return null;
	return {
		userId: user.id || null,
		name: user.name || user.username || "Unknown",
		username: user.username || "",
	};
}

// Compares the resident's current field values against the incoming update
// payload and returns a list of human-readable changes (only fields that
// actually differ, and only ones we know how to label).
async function buildResidentChanges(existing: any, updateData: any) {
	const changes: { field: string; label: string; oldValue: string | null; newValue: string | null }[] = [];

	const sitioNameCache = new Map<string, string>();
	const householdCodeCache = new Map<string, string>();

	const getSitioName = async (idVal: any) => {
		if (!idVal) return null;
		const key = idVal.toString();
		if (!sitioNameCache.has(key)) {
			const s = await Sitio.findById(key);
			sitioNameCache.set(key, s?.name || key);
		}
		return sitioNameCache.get(key) || null;
	};

	const getHouseholdCode = async (idVal: any) => {
		if (!idVal) return null;
		const key = idVal.toString();
		if (!householdCodeCache.has(key)) {
			const h = await Household.findById(key);
			householdCodeCache.set(key, h?.household_code || key);
		}
		return householdCodeCache.get(key) || null;
	};

	for (const field of Object.keys(updateData)) {
		if (!(field in FIELD_LABELS)) continue;

		const oldVal = existing[field];
		const newVal = updateData[field];

		let isDifferent: boolean;
		let oldDisplay: string | null;
		let newDisplay: string | null;

		if (field === "sitio") {
			const oldId = oldVal ? oldVal.toString() : null;
			const newId = newVal ? newVal.toString() : null;
			isDifferent = oldId !== newId;
			oldDisplay = oldId ? await getSitioName(oldId) : null;
			newDisplay = newId ? await getSitioName(newId) : null;
		} else if (field === "householdId") {
			const oldId = oldVal ? oldVal.toString() : null;
			const newId = newVal ? newVal.toString() : null;
			isDifferent = oldId !== newId;
			oldDisplay = oldId ? await getHouseholdCode(oldId) : null;
			newDisplay = newId ? await getHouseholdCode(newId) : null;
		} else if (field === "birthdate") {
			const oldTime = oldVal ? new Date(oldVal).getTime() : null;
			const newTime = newVal ? new Date(newVal).getTime() : null;
			isDifferent = oldTime !== newTime;
			oldDisplay = oldVal ? new Date(oldVal).toISOString().slice(0, 10) : null;
			newDisplay = newVal ? new Date(newVal).toISOString().slice(0, 10) : null;
		} else if (typeof newVal === "boolean" || typeof oldVal === "boolean") {
			isDifferent = Boolean(oldVal) !== Boolean(newVal);
			oldDisplay = Boolean(oldVal) ? "Yes" : "No";
			newDisplay = Boolean(newVal) ? "Yes" : "No";
		} else {
			const oldStr = oldVal === undefined || oldVal === null ? "" : String(oldVal);
			const newStr = newVal === undefined || newVal === null ? "" : String(newVal);
			isDifferent = oldStr !== newStr;
			oldDisplay = oldStr || null;
			newDisplay = newStr || null;
		}

		if (isDifferent) {
			changes.push({
				field,
				label: FIELD_LABELS[field] || field,
				oldValue: oldDisplay,
				newValue: newDisplay,
			});
		}
	}

	return changes;
}

export const residentResolvers = {
	Resident: {
		sitio: async (parent: any) => {
			if (parent.sitio && typeof parent.sitio === "object") {
				return parent.sitio;
			}
			return parent.sitio;
		},
		birthdate: (parent: any) => {
			return parent.birthdate instanceof Date
				? parent.birthdate.toISOString()
				: parent.birthdate;
		},
		employment_status: (parent: any) => {
			return parent.employment_status ?? "N/A";
		},
		household: async (parent: any) => {
			if (!parent.householdId) return null;
			return await Household.findById(parent.householdId).populate("sitio");
		},
	},

	Query: {
		residents: async (
_: any,
{
filters,
search,
page,
pageSize,
}: { filters?: any; search?: string; page?: number; pageSize?: number },
		) => {
			try {
				const query: any = { isDeleted: { $ne: true } };

				if (filters) {
					if (filters.sitioId) query.sitio = filters.sitioId;
					if (filters.civil_status) query.civil_status = filters.civil_status;
					if (filters.is_ofw !== undefined) query.is_ofw = filters.is_ofw;
					if (filters.is_solo_parent !== undefined) query.is_solo_parent = filters.is_solo_parent;
					if (filters.indigent !== undefined) query.indigent = filters.indigent;
					if (filters.osc !== undefined) query.osc = filters.osc;
					if (filters.isPwd !== undefined) query.isPwd = filters.isPwd;
					if (filters.registered_voter !== undefined) query.registered_voter = filters.registered_voter;
					if (filters.is4Ps !== undefined) query.is4Ps = filters.is4Ps;
					if (filters.isSeniorCitizen !== undefined) query.isSeniorCitizen = filters.isSeniorCitizen;
					if (filters.isNHTS !== undefined) query.isNHTS = filters.isNHTS;
					if (filters.isFarmer !== undefined) query.isFarmer = filters.isFarmer;
				}

				if (search) {
					const searchFields = ["first_name", "middle_name", "last_name", "email", "resident_code", "address"];
					const words = search.trim().split(/\s+/);
					if (words.length > 1) {
						// Multi-word: each word must match at least one field
						query.$and = words.map((word) => ({
							$or: searchFields.map((field) => ({ [field]: { $regex: word, $options: "i" } })),
						}));
					} else {
						query.$or = searchFields.map((field) => ({ [field]: { $regex: search, $options: "i" } }));
					}
				}

				const totalCount = await Resident.countDocuments(query);
				const currentPage = page && page > 0 ? page : 1;
				const limit = pageSize && pageSize > 0 ? pageSize : 10;
				const skip = (currentPage - 1) * limit;

				const residents = await Resident.find(query)
					.populate("sitio")
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit);

				return { success: true, message: "Residents fetched successfully", residents, totalCount };
			} catch (error: any) {
				return { success: false, message: `Failed to fetch residents: ${error.message}`, residents: [], totalCount: 0 };
			}
		},

		resident: async (_: any, { id }: { id: string }) => {
			try {
				const resident = await Resident.findOne({ _id: id, isDeleted: { $ne: true } }).populate("sitio");
				if (!resident) {
					return { success: false, message: "Resident not found", resident: null };
				}
				return { success: true, message: "Resident fetched successfully", resident };
			} catch (error: any) {
				return { success: false, message: `Failed to fetch resident: ${error.message}`, resident: null };
			}
		},

		headResidents: async (_: any, { search }: { search?: string }) => {
			try {
				const query: any = { isHead: true, isDeleted: { $ne: true } };
				if (search) {
					query.$or = [
						{ first_name: { $regex: search, $options: "i" } },
						{ middle_name: { $regex: search, $options: "i" } },
						{ last_name: { $regex: search, $options: "i" } },
						{ resident_code: { $regex: search, $options: "i" } },
					];
				}
				// Unbounded dropdown query -- capped so it can't pull the entire
				// collection as data grows. In practice these feed a search-as-you-type
				// Select, so a real search narrows well below this anyway.
				const residents = await Resident.find(query).populate("sitio").sort({ createdAt: -1 }).limit(200);
				return { success: true, message: "Residents fetched successfully", residents };
			} catch (error: any) {
				return { success: false, message: `Failed: ${error.message}`, residents: [] };
			}
		},

		getResidentWithoutHousehold: async (_: any, { search }: { search?: string }) => {
			try {
				const query: any = { householdId: null, isDeleted: { $ne: true } };
				if (search) {
					query.$or = [
						{ first_name: { $regex: search, $options: "i" } },
						{ middle_name: { $regex: search, $options: "i" } },
						{ last_name: { $regex: search, $options: "i" } },
						{ resident_code: { $regex: search, $options: "i" } },
					];
				}
				const residents = await Resident.find(query).populate("sitio").sort({ createdAt: -1 }).limit(200);
				return { success: true, message: "Residents fetched successfully", residents };
			} catch (error: any) {
				return { success: false, message: `Failed: ${error.message}`, residents: [] };
			}
		},

		populationReport: async () => {
			try {
				const today = new Date();
				const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
				const NON_IP = ["non-indigenous", "none", "n/a", "na", "-", ""];

				// Helper to build a conditional sum expression
				const s = (cond: any) => ({ $sum: { $cond: [cond, 1, 0] } });
				const and = (...args: any[]) => ({ $and: args });

				const [raw] = await (Resident as any).aggregate([
					{ $match: { status: "Active", isDeleted: { $ne: true } } },
					{
						$addFields: {
							age: {
								$floor: {
									$divide: [
										{ $subtract: [today, { $toDate: "$birthdate" }] },
										MS_PER_YEAR,
									],
								},
							},
							isMale: { $in: ["$gender", ["Male", "MALE"]] },
							isFemale: { $in: ["$gender", ["Female", "FEMALE"]] },
							isIP: {
								$not: {
									$in: [
										{
											$toLower: {
												$trim: {
													input: { $ifNull: ["$indigenous_group", ""] },
												},
											},
										},
										NON_IP,
									],
								},
							},
							isFilipino: {
								$eq: [
									{ $toLower: { $ifNull: ["$citizenship", ""] } },
									"filipino",
								],
							},
						},
					},
					{
						$group: {
							_id: null,
							total: { $sum: 1 },
							totalMale: s("$isMale"),
							totalFemale: s("$isFemale"),
							// Age brackets
							ag_u5_m: s(and("$isMale", { $lt: ["$age", 5] })),
							ag_u5_f: s(and("$isFemale", { $lt: ["$age", 5] })),
							ag_5_m: s(and("$isMale", { $gte: ["$age", 5] }, { $lte: ["$age", 9] })),
							ag_5_f: s(and("$isFemale", { $gte: ["$age", 5] }, { $lte: ["$age", 9] })),
							ag_10_m: s(and("$isMale", { $gte: ["$age", 10] }, { $lte: ["$age", 14] })),
							ag_10_f: s(and("$isFemale", { $gte: ["$age", 10] }, { $lte: ["$age", 14] })),
							ag_15_m: s(and("$isMale", { $gte: ["$age", 15] }, { $lte: ["$age", 19] })),
							ag_15_f: s(and("$isFemale", { $gte: ["$age", 15] }, { $lte: ["$age", 19] })),
							ag_20_m: s(and("$isMale", { $gte: ["$age", 20] }, { $lte: ["$age", 24] })),
							ag_20_f: s(and("$isFemale", { $gte: ["$age", 20] }, { $lte: ["$age", 24] })),
							ag_25_m: s(and("$isMale", { $gte: ["$age", 25] }, { $lte: ["$age", 29] })),
							ag_25_f: s(and("$isFemale", { $gte: ["$age", 25] }, { $lte: ["$age", 29] })),
							ag_30_m: s(and("$isMale", { $gte: ["$age", 30] }, { $lte: ["$age", 34] })),
							ag_30_f: s(and("$isFemale", { $gte: ["$age", 30] }, { $lte: ["$age", 34] })),
							ag_35_m: s(and("$isMale", { $gte: ["$age", 35] }, { $lte: ["$age", 39] })),
							ag_35_f: s(and("$isFemale", { $gte: ["$age", 35] }, { $lte: ["$age", 39] })),
							ag_40_m: s(and("$isMale", { $gte: ["$age", 40] }, { $lte: ["$age", 44] })),
							ag_40_f: s(and("$isFemale", { $gte: ["$age", 40] }, { $lte: ["$age", 44] })),
							ag_45_m: s(and("$isMale", { $gte: ["$age", 45] }, { $lte: ["$age", 49] })),
							ag_45_f: s(and("$isFemale", { $gte: ["$age", 45] }, { $lte: ["$age", 49] })),
							ag_50_m: s(and("$isMale", { $gte: ["$age", 50] }, { $lte: ["$age", 54] })),
							ag_50_f: s(and("$isFemale", { $gte: ["$age", 50] }, { $lte: ["$age", 54] })),
							ag_55_m: s(and("$isMale", { $gte: ["$age", 55] }, { $lte: ["$age", 59] })),
							ag_55_f: s(and("$isFemale", { $gte: ["$age", 55] }, { $lte: ["$age", 59] })),
							ag_60_m: s(and("$isMale", { $gte: ["$age", 60] }, { $lte: ["$age", 64] })),
							ag_60_f: s(and("$isFemale", { $gte: ["$age", 60] }, { $lte: ["$age", 64] })),
							ag_65_m: s(and("$isMale", { $gte: ["$age", 65] }, { $lte: ["$age", 69] })),
							ag_65_f: s(and("$isFemale", { $gte: ["$age", 65] }, { $lte: ["$age", 69] })),
							ag_70_m: s(and("$isMale", { $gte: ["$age", 70] }, { $lte: ["$age", 74] })),
							ag_70_f: s(and("$isFemale", { $gte: ["$age", 70] }, { $lte: ["$age", 74] })),
							ag_75_m: s(and("$isMale", { $gte: ["$age", 75] }, { $lte: ["$age", 79] })),
							ag_75_f: s(and("$isFemale", { $gte: ["$age", 75] }, { $lte: ["$age", 79] })),
							ag_80_m: s(and("$isMale", { $gte: ["$age", 80] })),
							ag_80_f: s(and("$isFemale", { $gte: ["$age", 80] })),
							// Sectors — based on employment_status field
							labor_m: s(and("$isMale", { $eq: ["$employment_status", "Employed"] }, { $gte: ["$age", 15] }, { $not: "$is_ofw" })),
							labor_f: s(and("$isFemale", { $eq: ["$employment_status", "Employed"] }, { $gte: ["$age", 15] }, { $not: "$is_ofw" })),
							unemployed_m: s(and("$isMale", { $eq: ["$employment_status", "Unemployed"] }, { $gte: ["$age", 15] }, { $not: "$is_ofw" })),
							unemployed_f: s(and("$isFemale", { $eq: ["$employment_status", "Unemployed"] }, { $gte: ["$age", 15] }, { $not: "$is_ofw" })),
							osc_m: s(and("$isMale", "$osc", { $gte: ["$age", 6] }, { $lte: ["$age", 14] })),
							osc_f: s(and("$isFemale", "$osc", { $gte: ["$age", 6] }, { $lte: ["$age", 14] })),
							osy_m: s(and("$isMale", "$osc", { $gte: ["$age", 15] }, { $lte: ["$age", 24] })),
							osy_f: s(and("$isFemale", "$osc", { $gte: ["$age", 15] }, { $lte: ["$age", 24] })),
							pwd_m: s(and("$isMale", "$isPwd")),
							pwd_f: s(and("$isFemale", "$isPwd")),
							ofw_m: s(and("$isMale", "$is_ofw")),
							ofw_f: s(and("$isFemale", "$is_ofw")),
							solo_m: s(and("$isMale", "$is_solo_parent")),
							solo_f: s(and("$isFemale", "$is_solo_parent")),
							ip_m: s(and("$isMale", "$isIP")),
							ip_f: s(and("$isFemale", "$isIP")),
							// Civil status
							cs_single_m: s(and("$isMale", { $eq: ["$civil_status", "Single"] })),
							cs_single_f: s(and("$isFemale", { $eq: ["$civil_status", "Single"] })),
							cs_married_m: s(and("$isMale", { $eq: ["$civil_status", "Married"] })),
							cs_married_f: s(and("$isFemale", { $eq: ["$civil_status", "Married"] })),
							cs_widowed_m: s(and("$isMale", { $eq: ["$civil_status", "Widowed"] })),
							cs_widowed_f: s(and("$isFemale", { $eq: ["$civil_status", "Widowed"] })),
							cs_sep_m: s(and("$isMale", { $eq: ["$civil_status", "Separated"] })),
							cs_sep_f: s(and("$isFemale", { $eq: ["$civil_status", "Separated"] })),
							// Citizenship
							cit_fil_m: s(and("$isMale", "$isFilipino")),
							cit_fil_f: s(and("$isFemale", "$isFilipino")),
							cit_for_m: s(and("$isMale", { $not: "$isFilipino" })),
							cit_for_f: s(and("$isFemale", { $not: "$isFilipino" })),
							total4Ps: s("$is4Ps"),
							totalSeniors: s("$isSeniorCitizen"),
							totalFarmers: s("$isFarmer"),
						},
					},
				]);

				const totalHouseholds = await Household.countDocuments({ parentHouseholdId: null });
				const totalFamilies = await Household.countDocuments({});

				const seniorResidents = await Resident.find({ isSeniorCitizen: true, status: "Active", isDeleted: { $ne: true } })
					.populate("sitio")
					.sort({ last_name: 1 });

				const seniorCitizens = seniorResidents.map((r: any) => {
					const ageMs = today.getTime() - new Date(r.birthdate).getTime();
					const age = Math.floor(ageMs / MS_PER_YEAR);
					return {
						id: r._id,
						resident_code: r.resident_code,
						name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(" "),
						age,
						gender: r.gender,
						sitio: r.sitio?.name ?? "",
						address: r.address ?? "",
					};
				});

				if (!raw) {
					return {
						success: true,
						message: "No active residents found",
						report: {
							totalInhabitants: 0, totalMale: 0, totalFemale: 0,
							totalHouseholds, totalFamilies, total4Ps: 0, totalSeniors: 0, totalFarmers: 0,
							ageBrackets: [], sectors: [], civilStatus: [], citizenship: [],
							seniorCitizens,
						},
					};
				}

				const mk = (indicator: string, male: number, female: number) => ({
					indicator, male, female, total: male + female,
				});

				return {
					success: true,
					message: "Population report fetched successfully",
					report: {
						totalInhabitants: raw.total,
						totalMale: raw.totalMale,
						totalFemale: raw.totalFemale,
						totalHouseholds,
						totalFamilies,
						total4Ps: raw.total4Ps,
						totalSeniors: raw.totalSeniors,
						totalFarmers: raw.totalFarmers,
						seniorCitizens,
						ageBrackets: [
							mk("Under 5 years old", raw.ag_u5_m, raw.ag_u5_f),
							mk("5-9 years old", raw.ag_5_m, raw.ag_5_f),
							mk("10-14 years old", raw.ag_10_m, raw.ag_10_f),
							mk("15-19 years old", raw.ag_15_m, raw.ag_15_f),
							mk("20-24 years old", raw.ag_20_m, raw.ag_20_f),
							mk("25-29 years old", raw.ag_25_m, raw.ag_25_f),
							mk("30-34 years old", raw.ag_30_m, raw.ag_30_f),
							mk("35-39 years old", raw.ag_35_m, raw.ag_35_f),
							mk("40-44 years old", raw.ag_40_m, raw.ag_40_f),
							mk("45-49 years old", raw.ag_45_m, raw.ag_45_f),
							mk("50-54 years old", raw.ag_50_m, raw.ag_50_f),
							mk("55-59 years old", raw.ag_55_m, raw.ag_55_f),
							mk("60-64 years old", raw.ag_60_m, raw.ag_60_f),
							mk("65-69 years old", raw.ag_65_m, raw.ag_65_f),
							mk("70-74 years old", raw.ag_70_m, raw.ag_70_f),
							mk("75-79 years old", raw.ag_75_m, raw.ag_75_f),
							mk("80 years old and over", raw.ag_80_m, raw.ag_80_f),
						],
						sectors: [
							mk("Labor Force", raw.labor_m, raw.labor_f),
							mk("Unemployed", raw.unemployed_m, raw.unemployed_f),
							mk("Out of School Children (OSC) (6-14 years old)", raw.osc_m, raw.osc_f),
							mk("Out of School Youth (OSY) (15-24 years old)", raw.osy_m, raw.osy_f),
							mk("Person with Disabilities (PWDs)", raw.pwd_m, raw.pwd_f),
							mk("Overseas Filipino Workers (OFWs)", raw.ofw_m, raw.ofw_f),
							mk("Solo Parents", raw.solo_m, raw.solo_f),
							mk("Indigenous Peoples (IPs)", raw.ip_m, raw.ip_f),
						],
						civilStatus: [
							mk("Civil Status: Single", raw.cs_single_m, raw.cs_single_f),
							mk("Married", raw.cs_married_m, raw.cs_married_f),
							mk("Widowed", raw.cs_widowed_m, raw.cs_widowed_f),
							mk("Separated", raw.cs_sep_m, raw.cs_sep_f),
						],
						citizenship: [
							mk("Citizenship: Filipino", raw.cit_fil_m, raw.cit_fil_f),
							mk("Foreigner", raw.cit_for_m, raw.cit_for_f),
						],
					},
				};
			} catch (error: any) {
				return { success: false, message: `Failed: ${error.message}`, report: null };
			}
		},

		residentHistory: async (_: any, { residentId }: { residentId: string }) => {
			try {
				const history = await ResidentHistory.find({ residentId }).sort({ createdAt: -1 });

				return {
					success: true,
					message: "History fetched successfully",
					history: history.map((h: any) => ({
						id: h._id,
						action: h.action,
						changes: (h.changes || []).map((c: any) => ({
							field: c.field,
							label: c.label,
							oldValue: c.oldValue ?? null,
							newValue: c.newValue ?? null,
						})),
						editedByName: h.editedBy?.name || "Unknown",
						editedByUsername: h.editedBy?.username || "",
						createdAt: h.createdAt.toISOString(),
					})),
				};
			} catch (error: any) {
				return { success: false, message: `Failed to fetch history: ${error.message}`, history: [] };
			}
		},

		dashboardStats: async () => {
			try {
				const totalHouseholds = await Household.countDocuments({ parentHouseholdId: null });
				const totalFamilies = await Household.countDocuments({});
				const totalPopulation = await Resident.countDocuments({ status: "Active", isDeleted: { $ne: true } });

				return {
					success: true,
					message: "Dashboard stats fetched successfully",
					stats: { totalHouseholds, totalFamilies, totalPopulation },
				};
			} catch (error: any) {
				return { success: false, message: `Failed: ${error.message}`, stats: null };
			}
		},
	},

	Mutation: {
		createResident: requireEditor(async (_: any, { input }: { input: any }, context: any) => {
			try {
				// Check duplicate email
				if (input.email) {
					const existingEmail = await Resident.findOne({ email: input.email, isDeleted: { $ne: true } });
					if (existingEmail) {
						throw new Error("Email already exists");
					}
				}

				// Check duplicate name
				const existingResident = await Resident.findOne({
					first_name: input.first_name,
					middle_name: input.middle_name,
					last_name: input.last_name,
					isDeleted: { $ne: true },
				});
				if (existingResident) {
					throw new Error("Resident with the same name already exists");
				}

				// If householdId is provided, validate household exists
				if (input.householdId) {
					const household = await Household.findById(input.householdId);
					if (!household) {
						throw new Error("Household not found");
					}

					if (input.isHead) {
						await Resident.updateMany(
							{ householdId: input.householdId, isHead: true },
							{ isHead: false },
						);
					}
				}

				// Generate resident_code
				const lastResident = await Resident.findOne().sort({ resident_code: -1 });
				const lastNum = lastResident
					? parseInt(lastResident.resident_code.replace("RES-", ""), 10)
					: 0;
				const resident_code = `RES-${String(lastNum + 1).padStart(5, "0")}`;

				const resident = new Resident({
					resident_code,
					first_name: input.first_name,
					middle_name: input.middle_name,
					last_name: input.last_name,
					email: input.email,
					birthdate: new Date(input.birthdate),
					place_of_birth: input.place_of_birth,
					address: input.address,
					gender: input.gender,
					sitio: input.sitioId,
					civil_status: input.civil_status,
					occupation: input.occupation,
					employment_status: input.employment_status || "N/A",
					citizenship: input.citizenship,
					indigenous_group: input.indigenous_group,
					registered_voter: input.registered_voter || false,
					is_ofw: input.is_ofw || false,
					is_solo_parent: input.is_solo_parent || false,
					osc: input.osc || false,
					indigent: input.indigent || false,
					isPwd: input.isPwd || false,
					status: input.status,
					isHead: input.isHead || false,
					is4Ps: input.is4Ps || false,
					isSeniorCitizen: input.isSeniorCitizen || false,
					isNHTS: input.isNHTS || false,
					isFarmer: input.isFarmer || false,
					householdId: input.householdId || null,
				});

				await resident.save();

				await ResidentHistory.create({
					residentId: resident._id,
					residentName: `${resident.first_name} ${resident.last_name}`,
					residentCode: resident.resident_code,
					action: "created",
					changes: [],
					editedBy: getEditorSnapshot(context),
				});

				// If isHead and NO householdId → auto-create a new household
				if (input.isHead && !input.householdId) {
					const lastHH = await Household.findOne().sort({ household_code: -1 });
					const lastHHNum = lastHH
						? parseInt(lastHH.household_code.replace("HH-", ""), 10)
						: 0;
					const household_code = `HH-${String(lastHHNum + 1).padStart(5, "0")}`;

					const household = new Household({
						household_code,
						sitio: input.sitioId,
					});
					await household.save();

					await Resident.findByIdAndUpdate(resident._id, { householdId: household._id });

					if (input.memberIds && input.memberIds.length > 0) {
						const members = await Resident.find({ _id: { $in: input.memberIds } });
						const alreadyAssigned = members.filter((m: any) => m.householdId != null);
						if (alreadyAssigned.length > 0) {
							const names = alreadyAssigned.map((m: any) => `${m.first_name} ${m.last_name}`).join(", ");
							throw new Error(`These residents already belong to a household: ${names}`);
						}
						await Resident.updateMany(
							{ _id: { $in: input.memberIds } },
							{ householdId: household._id },
						);
					}
				}

				return { success: true, message: "Resident created successfully", id: resident._id };
			} catch (error: any) {
				return { success: false, message: error.message || "Failed to create resident", id: null };
			}
		}),

		updateResident: requireEditor(async (_: any, { id, input }: { id: string; input: any }, context: any) => {
			try {
				const existingResident = await Resident.findById(id);
				if (!existingResident) {
					throw new Error("Resident not found");
				}

				const newHouseholdId = input.householdId || null;
				const nowHead = input.isHead || false;

				if (nowHead && newHouseholdId) {
					await Resident.updateMany(
						{ householdId: newHouseholdId, isHead: true, _id: { $ne: id } },
						{ isHead: false },
					);
				}

				const updateData: any = {
					first_name: input.first_name,
					middle_name: input.middle_name,
					last_name: input.last_name,
					email: input.email,
					birthdate: new Date(input.birthdate),
					place_of_birth: input.place_of_birth,
					address: input.address,
					gender: input.gender,
					sitio: input.sitioId,
					civil_status: input.civil_status,
					occupation: input.occupation,
					employment_status: input.employment_status || "N/A",
					citizenship: input.citizenship,
					indigenous_group: input.indigenous_group,
					registered_voter: input.registered_voter,
					is_ofw: input.is_ofw,
					is_solo_parent: input.is_solo_parent,
					osc: input.osc,
					indigent: input.indigent,
					isPwd: input.isPwd,
					status: input.status,
					isHead: nowHead,
					is4Ps: input.is4Ps,
					isSeniorCitizen: input.isSeniorCitizen,
					isNHTS: input.isNHTS,
					isFarmer: input.isFarmer,
					householdId: newHouseholdId,
				};

				const changes = await buildResidentChanges(existingResident, updateData);

				await Resident.findByIdAndUpdate(id, updateData, {
					new: true,
					runValidators: true,
				});

				if (changes.length > 0) {
					await ResidentHistory.create({
						residentId: id,
						residentName: `${existingResident.first_name} ${existingResident.last_name}`,
						residentCode: existingResident.resident_code,
						action: "updated",
						changes,
						editedBy: getEditorSnapshot(context),
					});
				}

				return { success: true, message: "Resident updated successfully", id };
			} catch (error: any) {
				return { success: false, message: error.message || "Failed to update resident", id: null };
			}
		}),

		deleteResident: requireAdmin(async (_: any, { id }: { id: string }, context: any) => {
			try {
				const resident = await Resident.findById(id);
				if (!resident || resident.isDeleted) {
					throw new Error("Resident not found");
				}

				// Soft delete: keep the record and its history, just hide it from
				// normal queries. Nothing is ever permanently removed from the DB.
				resident.isDeleted = true;
				resident.deletedAt = new Date();
				await resident.save();

				await ResidentHistory.create({
					residentId: id,
					residentName: `${resident.first_name} ${resident.last_name}`,
					residentCode: resident.resident_code,
					action: "deleted",
					changes: [],
					editedBy: getEditorSnapshot(context),
				});

				return { success: true, message: "Resident deleted successfully", id: null };
			} catch (error: any) {
				return { success: false, message: error.message || "Failed to delete resident", id: null };
			}
		}),
	},
};
