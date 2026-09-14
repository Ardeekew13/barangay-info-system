import Sitio from "../../models/Sitio";
import { requireAdmin, requireEditor } from "../authGuard";

export const sitioResolvers = {
  Query: {
    // Get all sitios with optional search
    sitios: async (_: any, { search }: { search?: string }) => {
      try {
        const query: any = {};

        // Add search functionality
        if (search) {
          query.name = { $regex: search, $options: "i" };
        }

        const sitios = await Sitio.find(query).sort({ name: 1 });
        
        return {
          success: true,
          message: "Sitios fetched successfully",
          sitios,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to fetch sitios: ${error.message}`,
          sitios: [],
        };
      }
    },

    // Get single sitio by ID
    sitio: async (_: any, { id }: { id: string }) => {
      try {
        const sitio = await Sitio.findById(id);
        
        if (!sitio) {
          return {
            success: false,
            message: "Sitio not found",
            sitio: null,
          };
        }

        return {
          success: true,
          message: "Sitio fetched successfully",
          sitio,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to fetch sitio: ${error.message}`,
          sitio: null,
        };
      }
    },
  },

  Mutation: {
    // Create new sitio
    createSitio: requireEditor(async (_: any, { input }: { input: { name: string } }) => {
      try {
        const sitio = new Sitio({ name: input.name });
        await sitio.save();

        return {
          success: true,
          message: "Sitio created successfully",
          sitio,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to create sitio: ${error.message}`,
          sitio: null,
        };
      }
    }),

    // Update sitio
    updateSitio: requireEditor(async (_: any, { id, input }: { id: string; input: { name: string } }) => {
      try {
        const sitio = await Sitio.findByIdAndUpdate(
          id,
          { name: input.name },
          { new: true, runValidators: true }
        );

        if (!sitio) {
          return {
            success: false,
            message: "Sitio not found",
            sitio: null,
          };
        }

        return {
          success: true,
          message: "Sitio updated successfully",
          sitio,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to update sitio: ${error.message}`,
          sitio: null,
        };
      }
    }),

    // Delete sitio
    deleteSitio: requireAdmin(async (_: any, { id }: { id: string }) => {
      try {
        const sitio = await Sitio.findByIdAndDelete(id);

        if (!sitio) {
          return {
            success: false,
            message: "Sitio not found",
            sitio: null,
          };
        }

        return {
          success: true,
          message: "Sitio deleted successfully",
          sitio: null,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to delete sitio: ${error.message}`,
          sitio: null,
        };
      }
    }),
  },
};
