import { Schema, model, models } from "mongoose";

const occupationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true, // Auto-creates createdAt and updatedAt
  }
);

export default models.Occupation || model("Occupation", occupationSchema);
