import { db } from '../db';
import { connectedDatabases, userLlmKeys } from '../db/schema';
import { eq } from 'drizzle-orm';
import { isEncrypted, encryptSecret } from '../lib/security/encryption';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrateLegacyEncryption() {
  console.log('Starting migration for legacy plaintext secrets...');
  
  let dbConnsMigrated = 0;
  const conns = await db.select().from(connectedDatabases);
  for (const conn of conns) {
    let changed = false;
    const updates: any = {};
    if (conn.password && !isEncrypted(conn.password)) {
      updates.password = encryptSecret(conn.password);
      changed = true;
    }
    if (conn.connectionString && !isEncrypted(conn.connectionString)) {
      updates.connectionString = encryptSecret(conn.connectionString);
      changed = true;
    }
    if (changed) {
      await db.update(connectedDatabases).set(updates).where(eq(connectedDatabases.id, conn.id as any));
      dbConnsMigrated++;
    }
  }

  let llmKeysMigrated = 0;
  const keys = await db.select().from(userLlmKeys);
  for (const key of keys) {
    if (key.apiKey && !isEncrypted(key.apiKey)) {
      await db.update(userLlmKeys).set({ apiKey: encryptSecret(key.apiKey) }).where(eq(userLlmKeys.id, key.id as any));
      llmKeysMigrated++;
    }
  }

  console.log(`Migration complete. Migrated ${dbConnsMigrated} db connections and ${llmKeysMigrated} LLM keys.`);
  process.exit(0);
}

migrateLegacyEncryption().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
