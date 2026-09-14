// Combine all GraphQL resolvers

import { sitioResolvers } from "./sitio";
import { residentResolvers } from "./resident";
import { householdResolvers } from "./household";
import { barangayOfficialResolvers } from "./barangayOfficial";
import { certificateTemplateResolvers } from "./certificateTemplate";
import { occupationResolvers } from "./occupation";
import { loginAuditResolvers } from "./loginAudit";
import { userResolvers } from "./user";

// Merge all resolvers
export const resolvers = {
  Query: {
    ...sitioResolvers.Query,
    ...residentResolvers.Query,
    ...householdResolvers.Query,
    ...barangayOfficialResolvers.Query,
    ...certificateTemplateResolvers.Query,
    ...occupationResolvers.Query,
    ...loginAuditResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...sitioResolvers.Mutation,
    ...residentResolvers.Mutation,
    ...householdResolvers.Mutation,
    ...barangayOfficialResolvers.Mutation,
    ...certificateTemplateResolvers.Mutation,
    ...occupationResolvers.Mutation,
    ...userResolvers.Mutation,
  },
  // Field resolvers
  Resident: residentResolvers.Resident,
  Household: householdResolvers.Household,
  BarangayOfficial: barangayOfficialResolvers.BarangayOfficial,
  CertificateTemplate: certificateTemplateResolvers.CertificateTemplate,
};
