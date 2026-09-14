import { Schema, model, models } from "mongoose";

const loginAuditSchema = new Schema(
  {
    // May be null when the attempt used a username that doesn't exist at all
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    username: { type: String, required: true },

    success: { type: Boolean, required: true },
    reason: {
      type: String,
      enum: [
        "success",
        "invalid_username",
        "invalid_password",
        "inactive_account",
        "account_locked",
      ],
      required: true,
    },

    ip: { type: String, default: "unknown" },
    userAgent: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

loginAuditSchema.index({ createdAt: -1 });
loginAuditSchema.index({ username: 1, createdAt: -1 });

export default models.LoginAudit || model("LoginAudit", loginAuditSchema);
