/**
 * One-off migration: copies every collection (and its GridFS buckets) from
 * your local MongoDB into Atlas, so the deployed app has your real data on
 * day one.
 *
 * Run this ON YOUR MAC, from the project root:
 *
 *   node migrate-to-atlas.js "<your Atlas connection string>"
 *
 * Safe to re-run: it drops and recreates each collection in Atlas before
 * copying, so running it again just re-syncs from local -> Atlas (local is
 * never touched).
 */

// Older Node versions (< 19) don'''t expose the Web Crypto API as a global,
// which newer versions of the mongodb driver need for SCRAM auth against Atlas.
if (typeof global.crypto === "undefined") {
  global.crypto = require("crypto").webcrypto;
}

const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

function loadLocalUri() {
  const envPath = path.join(__dirname, ".env.local");
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*MONGODB_URI\s*=\s*(.*)\s*$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("MONGODB_URI not found in .env.local");
}

async function main() {
  const localUri = loadLocalUri();
  let atlasUri = process.argv[2];
  if (!atlasUri) {
    console.error("Usage: node migrate-to-atlas.js \"<atlas connection string>\"");
    process.exit(1);
  }

  // Make sure the Atlas URI has a database name in the path (mongodb+srv://user:pass@host/DBNAME?...)
  const localDbName = new URL(localUri.replace("mongodb://", "http://")).pathname.replace(/^\//, "") || "barangay-info";
  const atlasUrl = new URL(atlasUri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://"));
  if (!atlasUrl.pathname || atlasUrl.pathname === "/") {
    atlasUri = atlasUri.replace(/\/?(\?|$)/, `/${localDbName}$1`);
    console.log(`No database name in the Atlas URI -- using "${localDbName}".`);
  }

  console.log("Connecting to local MongoDB...");
  const localClient = new MongoClient(localUri);
  await localClient.connect();
  const localDb = localClient.db();

  console.log("Connecting to Atlas...");
  const atlasClient = new MongoClient(atlasUri);
  await atlasClient.connect();
  const atlasDb = atlasClient.db();

  const collections = await localDb.listCollections().toArray();
  console.log(`\nFound ${collections.length} collection(s)/bucket(s) in local DB "${localDb.databaseName}":`);
  console.log("  " + collections.map((c) => c.name).join(", "));

  let totalDocs = 0;
  for (const { name, type } of collections) {
    if (type === "view") continue;
    const localColl = localDb.collection(name);
    const count = await localColl.countDocuments();
    if (count === 0) {
      console.log(`\n[${name}] empty, skipping`);
      continue;
    }
    console.log(`\n[${name}] copying ${count} document(s)...`);
    const atlasColl = atlasDb.collection(name);
    await atlasColl.deleteMany({}); // safe re-run: clear existing copy first
    const BATCH = 500;
    let copied = 0;
    let batch = [];
    const cursor = localColl.find({});
    while (await cursor.hasNext()) {
      batch.push(await cursor.next());
      if (batch.length >= BATCH) {
        await atlasColl.insertMany(batch, { ordered: false });
        copied += batch.length;
        batch = [];
      }
    }
    if (batch.length) {
      await atlasColl.insertMany(batch, { ordered: false });
      copied += batch.length;
    }
    console.log(`[${name}] done -- ${copied} document(s)`);
    totalDocs += copied;
  }

  console.log(`\nAll done. ${totalDocs} document(s) copied into Atlas database "${atlasDb.databaseName}".`);

  await localClient.close();
  await atlasClient.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
