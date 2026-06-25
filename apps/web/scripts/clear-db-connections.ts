import { db } from '../db/index';
import { connectedDatabases } from '../db/schema';

async function main() {
  try {
    console.log("Clearing bad connected_databases...");
    await db.delete(connectedDatabases);
    console.log("Cleared successfully.");
  } catch (error) {
    console.error("Error clearing:", error);
  }
  process.exit(0);
}

main();
