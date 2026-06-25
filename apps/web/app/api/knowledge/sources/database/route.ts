import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { knowledgeSources, syncJobs, connectedDatabases, databaseSchemas } from '../../../../../db/schema';
import { inngest } from '../../../../../inngest/client';
import { DatabaseService, DBConnectionConfig } from '../../../../../lib/database/DatabaseService';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../../lib/errors';
import { encryptSecret } from '../../../../../lib/security/encryption';
import { RateLimitService } from '../../../../../lib/security/rate-limit';
import { isSafeHost } from '../../../../../lib/security/url-validator';

export async function POST(req: Request) {
  try {
    // 1. Authentication & Rate Limiting
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'database');
    if (rateLimitResponse) return rateLimitResponse;

    const { EntitlementEngine } = require('../../../../../lib/billing/entitlements');

    const featureCheck = await EntitlementEngine.hasFeature(user.id, 'database_access');
    if (!featureCheck.allowed) {
      throw new ValidationError(featureCheck.reason || 'Database Intelligence is disabled on your plan.');
    }

    const limitCheck = await EntitlementEngine.checkLimit({ userId: user.id, resource: 'database_connections' });
    if (!limitCheck.allowed) {
      throw new ValidationError(`Limit reached. You can only connect up to ${limitCheck.limit} Databases on your plan. Upgrade for more.`);
    }

    const body = await req.json();
    const { connectionString, host, port, database, databaseName, username, password, engine = 'pg', kbId } = body;
    
    const finalDatabaseName = databaseName || database;
    let targetKbId: number | null = null;
    
    // 2. Ownership Verification
    if (kbId && kbId !== 'none') {
       targetKbId = parseInt(kbId, 10);
       const ownershipError = await requireOwnership('knowledge_base', targetKbId, user.id);
       if (ownershipError) return ownershipError;
    }

    const portNum = port ? parseInt(String(port), 10) : undefined;
    const config: DBConnectionConfig = {
      engine, connectionString, host, port: portNum, database: finalDatabaseName || undefined, username, password
    };

    // 2.5 SSRF Protection
    let targetHost = host;
    if (!targetHost && connectionString) {
      try {
        // Handle postgresql://, mysql://, mongodb://, etc.
        const parsedUrl = new URL(connectionString.replace(/^(?!.*\:\/\/)(.*)$/, 'ignored://$1'));
        targetHost = parsedUrl.hostname;
      } catch (e) {
        // Could not parse
      }
    }

    if (targetHost) {
      const ssrfResult = await isSafeHost(targetHost);
      if (!ssrfResult.safe) {
        return NextResponse.json({ error: `Security Policy Violation: ${ssrfResult.error}` }, { status: 400 });
      }
      
      // Override the host in the connection config with the resolved IP
      // to prevent DNS Rebinding attacks
      if (ssrfResult.ip) {
        config.host = ssrfResult.ip;
        
        // If a connection string is used, replace the hostname with the IP
        if (config.connectionString) {
          try {
            const url = new URL(config.connectionString.replace(/^(?!.*\:\/\/)(.*)$/, 'ignored://$1'));
            url.hostname = ssrfResult.ip;
            config.connectionString = url.toString().replace(/^ignored:\/\//, '');
          } catch (e) {
            // Failed to parse, ignore
          }
        }
      }
    }

    const dbService = new DatabaseService(config);
    const isConnected = await dbService.testConnection();

    if (!isConnected) {
      throw new ValidationError('Failed to connect to the database. Check credentials.');
    }

    // Encrypt sensitive credentials before storing
    const encryptedConnectionString = connectionString ? encryptSecret(connectionString) : null;
    const encryptedPassword = password ? encryptSecret(password) : null;

    // 1. Create Connected Database Record
    const newDb = await db.insert(connectedDatabases).values({
      userId: user.id,
      kbId: targetKbId,
      name: `Database: ${finalDatabaseName || 'Custom'}`,
      engine,
      connectionString: encryptedConnectionString,
      host, port: portNum ?? null, databaseName: finalDatabaseName, username, password: encryptedPassword,
      accessMode: 'read_only'
    }).returning();
    const connectedDbId = newDb[0]!.id;

    // 2. Extract Schema
    const rawSchema = await dbService.extractSchema();

    // 3. Cache the raw schema
    await db.insert(databaseSchemas).values({
      databaseId: connectedDbId,
      schemaData: rawSchema
    });

    // 4. Create or Update Knowledge Source
    const newSource = await db.insert(knowledgeSources).values({
      userId: user.id,
      kbId: targetKbId,
      name: `Database: ${finalDatabaseName || 'Custom'}`,
      type: 'database',
      classification: { category: 'database', type: engine, language: 'sql' },
      configuration: { connectedDbId }, // Link to secure credentials
      syncStatus: 'pending'
    }).returning();
    const sourceId = newSource[0]!.id;

    // Create a Sync Job
    const syncJob = await db.insert(syncJobs).values({
      sourceId,
      status: 'queued',
      startedAt: new Date()
    }).returning();

    // 4. Dispatch to Inngest Worker
    await inngest.send({
      name: 'knowledge/process.database',
      data: {
        sourceId,
        syncJobId: syncJob[0]!.id,
        connectedDbId,
        engine,
        finalDatabaseName
      }
    });

    return NextResponse.json({ success: true, sourceId, connectedDbId, syncJobId: syncJob[0]!.id });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Database Source Route');
  }
}

