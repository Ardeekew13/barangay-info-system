// Combine all GraphQL type definitions

import { sitioTypeDefs } from "./sitio";
import { residentTypeDefs } from "./resident";
import { householdTypeDefs } from "./household";
import { barangayOfficialTypeDefs } from "./barangayOfficial";
import { certificateTemplateTypeDefs } from "./certificateTemplate";
import { occupationTypeDefs } from "./occupation";
import { loginAuditTypeDefs } from "./loginAudit";
import { userTypeDefs } from "./user";

// Merge all type definitions
export const typeDefs = [
	sitioTypeDefs,
	residentTypeDefs,
	householdTypeDefs,
	barangayOfficialTypeDefs,
	certificateTemplateTypeDefs,
	occupationTypeDefs,
	loginAuditTypeDefs,
	userTypeDefs,
];
