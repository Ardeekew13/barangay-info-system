import { Schema, model, models } from "mongoose";

const sitioSchema = new Schema(
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

export default models.Sitio || model("Sitio", sitioSchema);
