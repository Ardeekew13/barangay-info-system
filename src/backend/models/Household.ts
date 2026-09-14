import { Schema, model, models } from "mongoose";

const householdSchema = new Schema(
  {
    // Auto-generated household code
    household_code: {
      type: String,
      required: true,
      unique: true,
    },

    // Reference to Sitio
    sitio: {
      type: Schema.Types.ObjectId,
      ref: "Sitio",
      required: true,
    },

    // Optional link to another Household this one falls "under" -- e.g. a married
    // child's own family that still lives in the same house as their parents'
    // household. Each Household still has exactly one head (enforced on Resident),
    // this just records that the two households share a roof/location.
    parentHouseholdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: false,
      default: null,
    },

    // Members and head are derived from Resident collection (NOT stored here)
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt
  }
);

// Auto-generate household_code before saving
householdSchema.pre("save", async function () {
  if (!this.household_code) {
    const HouseholdModel =
      models.Household || model("Household", householdSchema);
    const last = await HouseholdModel.findOne().sort({ household_code: -1 });
    const lastNum = last
      ? parseInt(last.household_code.replace("HH-", ""), 10)
      : 0;
    this.household_code = `HH-${String(lastNum + 1).padStart(5, "0")}`;
  }
});

// Households List filters by sitio (householdsBySitio) and the parent-household
// lookup runs on every household detail view.
householdSchema.index({ sitio: 1 });
householdSchema.index({ parentHouseholdId: 1 });

export default models.Household || model("Household", householdSchema);
