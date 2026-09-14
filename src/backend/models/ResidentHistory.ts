import { Schema, model, models } from "mongoose";

const residentHistorySchema = new Schema(
  {
    // Which resident this entry belongs to
    residentId: {
      type: Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
      index: true,
    },

    // Snapshot of the resident's identity at the time of the change,
    // so the log still makes sense even if the resident is later renamed/deleted.
    residentName: { type: String },
    residentCode: { type: String },

    action: {
      type: String,
      enum: ["created", "updated", "deleted"],
      required: true,
    },

    // List of individual field changes for "updated" entries (empty for created/deleted)
    changes: [
      {
        _id: false,
        field: { type: String, required: true },
        label: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed, default: null },
        newValue: { type: Schema.Types.Mixed, default: null },
      },
    ],

    // Who made the change
    editedBy: {
      _id: false,
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      username: { type: String },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export default models.ResidentHistory || model("ResidentHistory", residentHistorySchema);
