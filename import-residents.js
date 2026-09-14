/**
 * Bulk import Households + Residents from an Excel file (see
 * resident_household_import_template.xlsx for the expected shape).
 *
 * Run this ON YOUR MAC, from the project root:
 *
 *   npm install xlsx --no-save   (only needed the first time)
 *   node import-residents.js path/to/your-filled-template.xlsx
 *
 * It reads MONGODB_URI from .env.local, so run it from the project root.
 *
 * What it does, in order:
 *   1. Reads the "Households" and "Residents" sheets.
 *   2. Creates any Sitio or Occupation that doesn't already exist (matched
 *      by name), so newly-imported residents show up correctly in the
 *      Manage > Occupation List dropdown afterward.
 *   3. Creates each Household (skipping ones whose Sitio + Parent Ref combo
 *      already exists is NOT attempted -- households have no natural key, so
 *      re-running will create duplicate households if you don't remove rows
 *      you already imported. Residents, below, ARE safe to re-run.)
 *   4. Creates each Resident, matched against existing residents by
 *      first_name + middle_name + last_name + birthdate so re-running the
 *      script after fixing a typo does not create duplicates.
 *   5. Links each Resident to their Household via the "Household Ref" column,
 *      and sets isHead based on "Is Household Head?".
 *
 * Prints a per-row [OK]/[SKIP]/[FAIL] log and a summary at the end.
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const XLSX = require("xlsx");

// ---- load MONGODB_URI from .env.local without adding a dotenv dependency ----
function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnvLocal();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local -- aborting.");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node import-residents.js path/to/filled-template.xlsx");
  process.exit(1);
}

// ---- Minimal schemas mirroring src/backend/models/*.ts ----
const SitioSchema = new mongoose.Schema({ name: { type: String, required: true, unique: true } }, { timestamps: true });
const OccupationSchema = new mongoose.Schema({ name: { type: String, required: true, unique: true } }, { timestamps: true });
const HouseholdSchema = new mongoose.Schema(
  {
    household_code: { type: String, required: true, unique: true },
    sitio: { type: mongoose.Schema.Types.ObjectId, ref: "Sitio", required: true },
    parentHouseholdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household", default: null },
  },
  { timestamps: true }
);
HouseholdSchema.pre("save", async function () {
  if (!this.household_code) {
    const Household = mongoose.models.Household || mongoose.model("Household", HouseholdSchema);
    const last = await Household.findOne().sort({ household_code: -1 });
    const lastNum = last ? parseInt(last.household_code.replace("HH-", ""), 10) : 0;
    this.household_code = `HH-${String(lastNum + 1).padStart(5, "0")}`;
  }
});
const ResidentSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true },
    middle_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other", "MALE", "FEMALE", "OTHER"] },
    civil_status: { type: String, required: true, enum: ["Single", "Married", "Widowed", "Separated"] },
    employment_status: { type: String, required: true, enum: ["Employed", "Unemployed", "Student", "Retired", "N/A"], default: "N/A" },
    status: { type: String, required: true, enum: ["Active", "Inactive", "Deceased"], default: "Active" },
    registered_voter: { type: Boolean, default: false },
    indigent: { type: Boolean, default: false },
    isPwd: { type: Boolean, default: false },
    is_ofw: { type: Boolean, default: false },
    is_solo_parent: { type: Boolean, default: false },
    osc: { type: Boolean, default: false },
    isHead: { type: Boolean, default: false },
    is4Ps: { type: Boolean, default: false },
    isSeniorCitizen: { type: Boolean, default: false },
    isNHTS: { type: Boolean, default: false },
    isFarmer: { type: Boolean, default: false },
    birthdate: { type: Date, required: true },
    occupation: { type: String, required: true },
    address: { type: String, required: true },
    place_of_birth: { type: String, required: true },
    citizenship: { type: String, required: true },
    indigenous_group: { type: String, required: true },
    sitio: { type: mongoose.Schema.Types.ObjectId, ref: "Sitio", required: true },
    resident_code: { type: String, required: true, unique: true },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household", required: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
ResidentSchema.pre("save", async function () {
  if (!this.resident_code) {
    const Resident = mongoose.models.Resident || mongoose.model("Resident", ResidentSchema);
    const count = await Resident.countDocuments();
    this.resident_code = `RES-${String(count + 1).padStart(4, "0")}`;
  }
});

const Sitio = mongoose.models.Sitio || mongoose.model("Sitio", SitioSchema);
const Occupation = mongoose.models.Occupation || mongoose.model("Occupation", OccupationSchema);
const Household = mongoose.models.Household || mongoose.model("Household", HouseholdSchema);
const Resident = mongoose.models.Resident || mongoose.model("Resident", ResidentSchema);

// ---- helpers ----
function truthy(v) {
  return String(v ?? "").trim().toLowerCase() === "yes";
}
function str(v) {
  return String(v ?? "").trim();
}
function parseDate(v) {
  if (v instanceof Date) return v;
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function readSheet(wb, name) {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}
// Column header lookup that ignores the trailing " *" markers used in the template.
function get(row, ...names) {
  for (const key of Object.keys(row)) {
    const clean = key.replace(/\s*\*\s*$/, "").trim().toLowerCase();
    for (const name of names) {
      if (clean === name.toLowerCase()) return row[key];
    }
  }
  return "";
}

async function getOrCreateSitio(name, cache) {
  const clean = str(name);
  if (!clean) throw new Error("Sitio is required");
  if (cache.has(clean)) return cache.get(clean);
  let sitio = await Sitio.findOne({ name: clean });
  if (!sitio) sitio = await Sitio.create({ name: clean });
  cache.set(clean, sitio);
  return sitio;
}

// Resident.occupation is stored as plain text (not a reference), but the
// Manage > Occupation List dropdown is a separate master list. Make sure
// every occupation seen during import exists there too, the same way
// Sitios are auto-created, so newly-imported residents show up correctly
// in that dropdown when edited later.
async function getOrCreateOccupation(name, cache) {
  const clean = str(name);
  if (!clean) throw new Error("Occupation is required");
  if (cache.has(clean)) return cache.get(clean);
  let occupation = await Occupation.findOne({ name: clean });
  if (!occupation) occupation = await Occupation.create({ name: clean });
  cache.set(clean, occupation);
  return occupation;
}

async function main() {
  const wb = XLSX.readFile(filePath);
  const hhRows = readSheet(wb, "Households");
  const resRows = readSheet(wb, "Residents");

  await mongoose.connect(MONGODB_URI);
  console.log(`Connected. ${hhRows.length} household row(s), ${resRows.length} resident row(s).\n`);

  const sitioCache = new Map();
  const occupationCache = new Map();
  const householdRefMap = new Map(); // "HH-REF-1" -> Household doc
  let hhOk = 0, hhFail = 0;

  console.log("--- Households ---");
  for (const row of hhRows) {
    const ref = str(get(row, "household ref"));
    const sitioName = str(get(row, "sitio"));
    const parentRef = str(get(row, "parent household ref (optional)", "parent household ref"));
    if (!ref || !sitioName) continue; // blank template row
    try {
      const sitio = await getOrCreateSitio(sitioName, sitioCache);
      const household = new Household({ sitio: sitio._id });
      if (parentRef) {
        const parent = householdRefMap.get(parentRef);
        if (!parent) throw new Error(`Parent Household Ref "${parentRef}" not found (must appear earlier in the sheet)`);
        household.parentHouseholdId = parent._id;
      }
      await household.save();
      householdRefMap.set(ref, household);
      console.log(`  [OK]   ${ref} -> ${household.household_code} (sitio: ${sitioName})`);
      hhOk++;
    } catch (err) {
      console.log(`  [FAIL] ${ref} -- ${err.message}`);
      hhFail++;
    }
  }

  console.log("\n--- Residents ---");
  let resOk = 0, resSkip = 0, resFail = 0;
  for (const [i, row] of resRows.entries()) {
    const first_name = str(get(row, "first name"));
    const last_name = str(get(row, "last name"));
    if (!first_name || !last_name) continue; // blank template row
    const rowLabel = `${first_name} ${last_name} (row ${i + 2})`;
    try {
      const middle_name = str(get(row, "middle name"));
      const birthdate = parseDate(get(row, "birthdate"));
      if (!birthdate) throw new Error("Birthdate is missing or not a valid date");

      const existing = await Resident.findOne({
        first_name,
        middle_name,
        last_name,
        birthdate,
        isDeleted: { $ne: true },
      });
      if (existing) {
        console.log(`  [SKIP] ${rowLabel} -- already exists (${existing.resident_code})`);
        resSkip++;
        continue;
      }

      const sitioName = str(get(row, "sitio"));
      const sitio = await getOrCreateSitio(sitioName, sitioCache);

      const occupationName = str(get(row, "occupation"));
      await getOrCreateOccupation(occupationName, occupationCache);

      const hhRef = str(get(row, "household ref"));
      let householdId;
      if (hhRef) {
        const household = householdRefMap.get(hhRef);
        if (!household) throw new Error(`Household Ref "${hhRef}" not found in the Households sheet`);
        householdId = household._id;
      }

      const email = str(get(row, "email"));
      const resident = new Resident({
        first_name,
        middle_name,
        last_name,
        email: email || undefined,
        gender: str(get(row, "gender")),
        civil_status: str(get(row, "civil status")),
        employment_status: str(get(row, "employment status")) || "N/A",
        status: str(get(row, "status")) || "Active",
        birthdate,
        occupation: occupationName,
        address: str(get(row, "address")),
        place_of_birth: str(get(row, "place of birth")),
        citizenship: str(get(row, "citizenship")),
        indigenous_group: str(get(row, "indigenous group")),
        sitio: sitio._id,
        householdId,
        isHead: truthy(get(row, "is household head?")),
        registered_voter: truthy(get(row, "registered voter?")),
        indigent: truthy(get(row, "indigent?")),
        isPwd: truthy(get(row, "pwd?")),
        is_ofw: truthy(get(row, "ofw?")),
        is_solo_parent: truthy(get(row, "solo parent?")),
        osc: truthy(get(row, "osc (out-of-school child/youth)?", "osc?")),
        is4Ps: truthy(get(row, "4ps beneficiary?")),
        isSeniorCitizen: truthy(get(row, "senior citizen?")),
        isNHTS: truthy(get(row, "nhts household?")),
        isFarmer: truthy(get(row, "farmer?")),
      });
      await resident.save();
      console.log(`  [OK]   ${rowLabel} -> ${resident.resident_code}`);
      resOk++;
    } catch (err) {
      console.log(`  [FAIL] ${rowLabel} -- ${err.message}`);
      resFail++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Households: ${hhOk} created, ${hhFail} failed`);
  console.log(`Residents:  ${resOk} created, ${resSkip} skipped (already existed), ${resFail} failed`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
