/**
 * Deletes every Household and Resident document from a MongoDB database --
 * used to reset production Atlas data while keeping everything else
 * (Sitios, Occupations, Barangay Officials, Certificate Templates,
 * generated certificates, login accounts, login audit history) intact.
 *
 * Run ON YOUR MAC, from the project root:
 *
 *   Dry run first (just shows counts, deletes nothing):
 *     node wipe-households-residents.js "<ATLAS_URI>"
 *
 *   Then actually delete (must pass --confirm):
 *     node wipe-households-residents.js "<ATLAS_URI>" --confirm
 *
 * Uses deleteMany({}) rather than dropping the collections, so indexes and
 * Mongoose schema validation stay intact -- new residents/households can
 * be added right after with no re-setup needed.
 */

if (typeof global.crypto === "undefined") {
  global.crypto = require("crypto").webcrypto;
}

const { MongoClient } = require("mongodb");

const uri = process.argv[2];
const confirmed = process.argv.includes("--confirm");

if (!uri) {
  console.error("Usage: node wipe-households-residents.js \"<ATLAS_URI>\" [--confirm]");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(); // uses the database name already in the connection string

  console.log(`Connected to database: ${db.databaseName}`);

  const residentsCount = await db.collection("residents").countDocuments();
  const householdsCount = await db.collection("households").countDocuments();

  console.log(`\nFound:`);
  console.log(`  residents:  ${residentsCount}`);
  console.log(`  households: ${householdsCount}`);

  if (!confirmed) {
    console.log(`\nDRY RUN -- nothing deleted. Re-run with --confirm to actually delete these documents:`);
    console.log(`  node wipe-households-residents.js "<ATLAS_URI>" --confirm`);
    await client.close();
    return;
  }

  console.log(`\n--confirm passed. Deleting...`);
  const residentsResult = await db.collection("residents").deleteMany({});
  console.log(`  Deleted ${residentsResult.deletedCount} residents`);
  const householdsResult = await db.collection("households").deleteMany({});
  console.log(`  Deleted ${householdsResult.deletedCount} households`);

  console.log(`\nDone. Everything else (sitios, occupations, barangay officials, certificate templates, users, login audit) was left untouched.`);
  await client.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
