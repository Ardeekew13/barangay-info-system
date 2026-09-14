import CertificateTemplate from "../../models/CertificateTemplate";
import { deleteTemplateFile } from "../../services/certificates/templateStorage";
import { requireAdmin } from "../authGuard";

export const certificateTemplateResolvers = {
	CertificateTemplate: {
		id: (parent: any) => parent.id || parent._id,
	},

	Query: {
		certificateTemplates: async (_: any, { activeOnly }: { activeOnly?: boolean }) => {
			try {
				const filter = activeOnly ? { isActive: true } : {};
				const templates = await CertificateTemplate.find(filter).sort({ name: 1 });
				return { success: true, message: "Templates fetched successfully", templates };
			} catch (error: any) {
				return { success: false, message: error.message, templates: [] };
			}
		},

		certificateTemplate: async (_: any, { key }: { key: string }) => {
			try {
				const template = await CertificateTemplate.findOne({ key });
				if (!template) return { success: false, message: "Template not found", template: null };
				return { success: true, message: "Template fetched successfully", template };
			} catch (error: any) {
				return { success: false, message: error.message, template: null };
			}
		},
	},

	Mutation: {
		updateCertificateTemplatePlaceholders: requireAdmin(async (
			_: any,
			{ key, placeholders }: { key: string; placeholders: any[] }
		) => {
			try {
				const template = await CertificateTemplate.findOneAndUpdate(
					{ key },
					{ placeholders },
					{ new: true }
				);
				if (!template) return { success: false, message: "Template not found", template: null };
				return { success: true, message: "Placeholders updated successfully", template };
			} catch (error: any) {
				return { success: false, message: error.message || "Failed to update placeholders", template: null };
			}
		}),

		setCertificateTemplateActive: requireAdmin(async (_: any, { key, isActive }: { key: string; isActive: boolean }) => {
			try {
				const template = await CertificateTemplate.findOneAndUpdate({ key }, { isActive }, { new: true });
				if (!template) return { success: false, message: "Template not found", template: null };
				return { success: true, message: "Template updated successfully", template };
			} catch (error: any) {
				return { success: false, message: error.message || "Failed to update template", template: null };
			}
		}),

		deleteCertificateTemplate: requireAdmin(async (_: any, { key }: { key: string }) => {
			try {
				const template = await CertificateTemplate.findOne({ key });
				if (!template) return { success: false, message: "Template not found" };

				try {
					await deleteTemplateFile(template.docxFileId);
				} catch (e) {
					// GridFS file may already be gone -- don't block deletion of the metadata on that
				}
				await CertificateTemplate.deleteOne({ key });

				return { success: true, message: "Template deleted successfully" };
			} catch (error: any) {
				return { success: false, message: error.message || "Failed to delete template" };
			}
		}),
	},
};
