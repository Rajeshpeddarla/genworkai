import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../db/index.js';
import { connectedDatabases } from '../db/schema.js';
import { encryptSecret, isEncrypted } from '../lib/security/encryption.js';

async function main() {
  console.log("Starting credential encryption migration...");
  
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 64) {
    console.error("CRITICAL ERROR: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).");
    process.exit(1);
  }

  const allDbs = await db.select().from(connectedDatabases);
  let updatedCount = 0;
  let skippedCount = 0;
  
  console.log(`Found ${allDbs.length} connected databases to process.`);

  for (const dbRecord of allDbs) {
    let needsUpdate = false;
    const updates: Partial<typeof dbRecord> = {};

    if (dbRecord.password && !isEncrypted(dbRecord.password)) {
      updates.password = encryptSecret(dbRecord.password);
      needsUpdate = true;
    }

    if (dbRecord.connectionString && !isEncrypted(dbRecord.connectionString)) {
      updates.connectionString = encryptSecret(dbRecord.connectionString);
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { eq } = await import('drizzle-orm');
      await db.update(connectedDatabases)
        .set(updates)
        .where(eq(connectedDatabases.id, dbRecord.id));
      console.log(`[Encrypted] Database ID: ${dbRecord.id} (${dbRecord.name})`);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`Migration complete. Encrypted ${updatedCount} records. Skipped ${skippedCount} (already encrypted or no secrets).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
