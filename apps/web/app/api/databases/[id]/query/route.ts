import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { connectedDatabases } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { DatabaseService, DBConnectionConfig } from '../../../../../lib/database/DatabaseService';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse, ValidationError, NotFoundError } from '../../../../../lib/errors';
import { decryptSecret, isEncrypted } from '../../../../../lib/security/encryption';
import { RateLimitService } from '../../../../../lib/security/rate-limit';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Authentication & Rate Limiting
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'database');
    if (rateLimitResponse) return rateLimitResponse;

    const { query } = await req.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (!query) {
      throw new ValidationError('Query is required');
    }

    // 2. Ownership Verification
    const ownershipError = await requireOwnership('database', id, user.id);
    if (ownershipError) return ownershipError;

    const dbs = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, id));
    if (dbs.length === 0) {
      throw new NotFoundError('Database');
    }

    const dbRecord = dbs[0]!;
    // Decrypt credentials
    const connectionString = dbRecord.connectionString
      ? (isEncrypted(dbRecord.connectionString) ? decryptSecret(dbRecord.connectionString) : dbRecord.connectionString)
      : undefined;
      
    const password = dbRecord.password
      ? (isEncrypted(dbRecord.password) ? decryptSecret(dbRecord.password) : dbRecord.password)
      : undefined;

    const config: DBConnectionConfig = {
      engine: dbRecord.engine as any,
      connectionString,
      host: dbRecord.host || undefined,
      port: typeof dbRecord.port === 'number' ? dbRecord.port : (dbRecord.port ? parseInt(String(dbRecord.port), 10) : undefined),
      database: dbRecord.databaseName || undefined,
      username: dbRecord.username || undefined,
      password,
    };

    const dbService = new DatabaseService(config);
    const results = await dbService.executeQuery(query);

    return NextResponse.json({ results });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Database Query Route');
  }
}
