import Occupation from "../../models/Occupation";
import { requireAdmin, requireEditor } from "../authGuard";

export const occupationResolvers = {
  Query: {
    // Get all occupations with optional search
    occupations: async (_: any, { search }: { search?: string }) => {
      try {
        const query: any = {};

        // Add search functionality
        if (search) {
          query.name = { $regex: search, $options: "i" };
        }

        const occupations = await Occupation.find(query).sort({ name: 1 });

        return {
          success: true,
          message: "Occupations fetched successfully",
          occupations,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to fetch occupations: ${error.message}`,
          occupations: [],
        };
      }
    },

    // Get single occupation by ID
    occupation: async (_: any, { id }: { id: string }) => {
      try {
        const occupation = await Occupation.findById(id);

        if (!occupation) {
          return {
            success: false,
            message: "Occupation not found",
            occupation: null,
          };
        }

        return {
          success: true,
          message: "Occupation fetched successfully",
          occupation,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to fetch occupation: ${error.message}`,
          occupation: null,
        };
      }
    },
  },

  Mutation: {
    // Create new occupation
    createOccupation: requireEditor(async (_: any, { input }: { input: { name: string } }) => {
      try {
        const existing = await Occupation.findOne({
          name: { $regex: `^${input.name.trim()}$`, $options: "i" },
        });
        if (existing) {
          return {
            success: false,
            message: "This occupation already exists",
            occupation: null,
          };
        }

        const occupation = new Occupation({ name: input.name.trim() });
        await occupation.save();

        return {
          success: true,
          message: "Occupation created successfully",
          occupation,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to create occupation: ${error.message}`,
          occupation: null,
        };
      }
    }),

    // Update occupation
    updateOccupation: requireEditor(async (_: any, { id, input }: { id: string; input: { name: string } }) => {
      try {
        const occupation = await Occupation.findByIdAndUpdate(
          id,
          { name: input.name.trim() },
          { new: true, runValidators: true }
        );

        if (!occupation) {
          return {
            success: false,
            message: "Occupation not found",
            occupation: null,
          };
        }

        return {
          success: true,
          message: "Occupation updated successfully",
          occupation,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to update occupation: ${error.message}`,
          occupation: null,
        };
      }
    }),

    // Delete occupation
    deleteOccupation: requireAdmin(async (_: any, { id }: { id: string }) => {
      try {
        const occupation = await Occupation.findByIdAndDelete(id);

        if (!occupation) {
          return {
            success: false,
            message: "Occupation not found",
            occupation: null,
          };
        }

        return {
          success: true,
          message: "Occupation deleted successfully",
          occupation: null,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to delete occupation: ${error.message}`,
          occupation: null,
        };
      }
    }),
  },
};
