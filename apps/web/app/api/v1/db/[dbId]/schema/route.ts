import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { connectedDatabases, databaseSchemas } from '../../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiAuthService } from '../../../../../../lib/auth/ApiAuthService';
import { safeErrorResponse, ValidationError } from '../../../../../../lib/errors';
import { DatabaseService, DBConnectionConfig } from '../../../../../../lib/database/DatabaseService';
import { decryptSecret } from '../../../../../../lib/security/encryption';
import { RateLimitService } from '../../../../../../lib/security/rate-limit';

export async function GET(req: Request, { params }: { params: Promise<{ dbId: string }> }) {
  const startTime = Date.now();
  let authResult;
  let metrics = { requests: 1 };

  try {
    const p = await params;
    const dbIdStr = p.dbId;
    const dbId = parseInt(dbIdStr, 10);
    if (isNaN(dbId)) {
      throw new ValidationError('Invalid Database ID');
    }

    const authHeader = req.headers.get('authorization');
    authResult = await ApiAuthService.validateRequest(authHeader, 'db:query', 'db', dbId);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await RateLimitService.check(authResult.userId!, 'v1');
    if (rateLimitResponse) return rateLimitResponse;

    const [dbConnection] = await db.select().from(connectedDatabases).where(and(eq(connectedDatabases.id, dbId), eq(connectedDatabases.userId, authResult.userId!)));
    if (!dbConnection) {
      throw new ValidationError('Database connection not found');
    }

    const dbService = new DatabaseService({
      engine: dbConnection.engine as DBConnectionConfig['engine'],
      connectionString: dbConnection.connectionString ? decryptSecret(dbConnection.connectionString) : undefined,
      host: dbConnection.host || undefined,
      port: dbConnection.port || undefined,
      database: dbConnection.databaseName || undefined,
      username: dbConnection.username || undefined,
      password: dbConnection.password ? decryptSecret(dbConnection.password) : undefined,
    });

    let schemaResult;
    try {
      schemaResult = await dbService.extractSchema();
      
      // Cache it for future reference by the platform
      await db.insert(databaseSchemas).values({
        databaseId: dbId,
        schemaData: schemaResult,
      });

    } catch (e: any) {
      // Fallback: Try to fetch cached schema if live extraction fails
      const [cachedSchema] = await db.select().from(databaseSchemas).where(eq(databaseSchemas.databaseId, dbId)).orderBy(databaseSchemas.extractedAt);
      if (cachedSchema) {
        schemaResult = cachedSchema.schemaData;
      } else {
        throw new Error(`Failed to extract schema and no cached schema available: ${e.message}`);
      }
    }

    const durationMs = Date.now() - startTime;
    ApiAuthService.logUsage({
      userId: authResult.userId!,
      apiKeyId: authResult.apiKeyId,
      endpoint: `/v1/db/${dbId}/schema`,
      resourceType: 'db',
      resourceId: dbId,
      status: 200,
      durationMs,
      metrics
    });

    return NextResponse.json({ schema: schemaResult });

  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    if (authResult?.isValid) {
      ApiAuthService.logUsage({
        userId: authResult.userId!,
        apiKeyId: authResult.apiKeyId,
        endpoint: `/v1/db/${(await params).dbId}/schema`,
        resourceType: 'db',
        resourceId: parseInt((await params).dbId, 10),
        status: error instanceof ValidationError ? 400 : 500,
        durationMs,
        metrics
      });
    }
    return safeErrorResponse(error, 'V1 DB Schema Extraction');
  }
}
