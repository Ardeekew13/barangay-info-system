import { Schema, model, models } from "mongoose";

const residentSchema = new Schema(
  {
    // String fields
    first_name: { type: String, required: true },
    middle_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true },

    // Enum fields (specific values only)
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other", "MALE", "FEMALE", "OTHER"],
    },
    civil_status: {
      type: String,
      required: true,
      enum: ["Single", "Married", "Widowed", "Separated"],
    },
    employment_status: {
      type: String,
      required: true,
      enum: ["Employed", "Unemployed", "Student", "Retired", "N/A"],
      default: "N/A",
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive", "Deceased"],
      default: "Active",
    },

    // Boolean fields
    registered_voter: { type: Boolean, default: false },
    indigent: { type: Boolean, default: false },
    isPwd: { type: Boolean, default: false },
    is_ofw: { type: Boolean, default: false },
    is_solo_parent: { type: Boolean, default: false },
    osc: { type: Boolean, default: false },
    isHead: { type: Boolean, default: false },

    // Classification fields
    is4Ps: { type: Boolean, default: false },
    isSeniorCitizen: { type: Boolean, default: false },
    isNHTS: { type: Boolean, default: false },
    isFarmer: { type: Boolean, default: false },

    // Date field
    birthdate: { type: Date, required: true },

    // Other string fields
    occupation: { type: String, required: true },
    address: { type: String, required: true },
    place_of_birth: { type: String, required: true },
    citizenship: { type: String, required: true },
    indigenous_group: { type: String, required: true },
    
    // Reference to location (Sitio)
    sitio: { 
      type: Schema.Types.ObjectId, 
      ref: "Sitio", 
      required: true 
    },

    // Auto-generated fields
    resident_code: {
      type: String,
      required: true,
      unique: true,
    },

    // Household reference (Optional - resident may not belong to a household yet)
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: false
    },

    // Soft delete — residents are never hard-deleted so their records and
    // edit history remain intact. Deleted residents are simply excluded
    // from normal queries.
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt
  }
);

// Auto-generate resident_code before saving
// Enforce only one isHead per household
residentSchema.index(
  { householdId: 1, isHead: 1 },
  { unique: true, partialFilterExpression: { isHead: true, householdId: { $type: "objectId" } } }
);

// The main Resident List query always filters isDeleted + sorts by createdAt,
// and often also filters by sitio -- without these, MongoDB has to scan every
// resident document on every page load once the collection grows past a
// trivial size.
residentSchema.index({ isDeleted: 1, createdAt: -1 });
residentSchema.index({ sitio: 1, isDeleted: 1 });
residentSchema.index({ householdId: 1 });

residentSchema.pre("save", async function () {
  if (!this.resident_code) {
    // Get the count of existing residents
    const ResidentModel = models.Resident || model("Resident", residentSchema);
    const count = await ResidentModel.countDocuments();
    // Generate code like: RES-0001, RES-0002, etc.
    this.resident_code = `RES-${String(count + 1).padStart(4, "0")}`;
  }
});

export default models.Resident || model("Resident", residentSchema);
