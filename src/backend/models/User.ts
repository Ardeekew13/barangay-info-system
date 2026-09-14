import { Schema, model, models } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "encoder", "viewer"],
      default: "encoder",
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Brute-force protection: incremented on each wrong password, reset on
    // a successful login. Once it hits the threshold (see [...nextauth].ts)
    // the account is temporarily locked via lockUntil.
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export default models.User || model("User", userSchema);
