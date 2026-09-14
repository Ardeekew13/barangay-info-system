import { Schema, model, models } from "mongoose";

const barangayOfficialSchema = new Schema(
  {
    residentId: { type: Schema.Types.ObjectId, ref: "Resident", required: true, unique: true },
    role: {
      type: String,
      required: true,
      enum: [
        "Punong Barangay",
        "Barangay Kagawad",
        "SK Chairperson",
        "Barangay Secretary",
        "Barangay Treasurer",
      ],
    },
  },
  { timestamps: true }
);

const BarangayOfficial = models.BarangayOfficial || model("BarangayOfficial", barangayOfficialSchema);
export default BarangayOfficial;
