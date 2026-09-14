import BarangayOfficial from "@/backend/models/BarangayOfficial";

// TODO: move into a Settings collection if this system ever needs to serve more than one barangay
const BARANGAY_NAME = "Zamora";
const ISSUED_AT = "Zamora, Bilar, Bohol";

function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatResidentName(resident: any): string {
  return `${resident.first_name} ${resident.middle_name ? resident.middle_name.charAt(0) + "." : ""} ${resident.last_name}`
    .trim()
    .toUpperCase();
}

/** Values every template can use without asking the clerk to type anything -- today's date, in every format the sample docs need, plus the sitting captain's name. */
export async function resolveSystemValues(): Promise<Record<string, string>> {
  const now = new Date();
  const day = now.getDate();

  const captain = await BarangayOfficial.findOne({ role: "Punong Barangay" }).populate("residentId");
  const captainName = captain?.residentId ? formatResidentName(captain.residentId) : "";

  return {
    DATE: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    DATE_DAY: String(day),
    DATE_DAY_SUFFIX: getDaySuffix(day),
    DATE_MONTH: now.toLocaleString("en-US", { month: "long" }),
    DATE_YEAR: String(now.getFullYear()),
    DATE_LONG: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    DATE_SHORT: `${String(now.getMonth() + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}/${now.getFullYear()}`,
    DATE_ISSUED: now.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    BARANGAY: BARANGAY_NAME,
    ISSUED_AT,
    CAPTAIN_NAME: captainName,
  };
}

/** Age in whole years as of today, computed from the resident's stored birthdate. */
function resolveAge(resident: any): string {
  if (!resident?.birthdate) return "";
  const birthdate = new Date(resident.birthdate);
  if (Number.isNaN(birthdate.getTime())) return "";

  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birthdate.getMonth() ||
    (now.getMonth() === birthdate.getMonth() && now.getDate() >= birthdate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return String(age);
}

/** Birthdate formatted the way the certificates spell it out, e.g. "March 14, 2000". */
function resolveBirthDate(resident: any): string {
  if (!resident?.birthdate) return "";
  const birthdate = new Date(resident.birthdate);
  if (Number.isNaN(birthdate.getTime())) return "";
  return birthdate.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function resolveParentLabel(resident: any): string {
  const gender = (resident.gender ?? "").toLowerCase();
  if (gender === "male") return "father";
  if (gender === "female") return "mother";
  return "parent";
}

/**
 * "Mr./Mrs." in the source certificates was always a static, ungendered placeholder.
 * Where we do have the resident's gender + civil status on file, resolve the real
 * honorific instead: Mr. for men, Mrs. for married/widowed women, Ms. for single or
 * separated women. Falls back to the old ungendered form when gender is "Other" or
 * unrecognized, so the certificate never mis-genders someone from bad/missing data.
 */
function resolveHonorific(resident: any): string {
  const gender = (resident.gender ?? "").toLowerCase();
  const civilStatus = (resident.civil_status ?? "").toLowerCase();

  if (gender === "male") return "Mr.";
  if (gender === "female") {
    if (civilStatus === "married" || civilStatus === "widowed") return "Mrs.";
    return "Ms."; // single or separated
  }
  return "Mr./Ms.";
}

/**
 * Certificates that used to hardcode "He/She" in the body text can instead bind
 * to this so the pronoun matches the resident's gender on file. Falls back to
 * the ungendered form for "Other"/missing gender, same reasoning as the
 * honorific above -- never guess a pronoun from incomplete data.
 */
function resolvePronoun(resident: any): string {
  const gender = (resident.gender ?? "").toLowerCase();
  if (gender === "male") return "He";
  if (gender === "female") return "She";
  return "He/She";
}

/** Possessive counterpart of resolvePronoun -- "his/her" style text in a few templates. */
function resolvePronounPossessive(resident: any): string {
  const gender = (resident.gender ?? "").toLowerCase();
  if (gender === "male") return "His";
  if (gender === "female") return "Her";
  return "His/Her";
}

/** Values sourced from the resident picked on the generation form. */
export function resolveResidentValues(resident: any): Record<string, string> {
  if (!resident) return {};
  return {
    FULL_NAME: formatResidentName(resident),
    ADDRESS: resident.address ?? "",
    CIVIL_STATUS: (resident.civil_status ?? "").toLowerCase(),
    PARENT_LABEL: resolveParentLabel(resident),
    HONORIFIC: resolveHonorific(resident),
    PRONOUN: resolvePronoun(resident),
    PRONOUN_POSSESSIVE: resolvePronounPossessive(resident),
    AGE: resolveAge(resident),
    BIRTH_DATE: resolveBirthDate(resident),
    OCCUPATION: resident.occupation ?? "",
    SITIO: resident.sitio?.name ?? "",
  };
}
