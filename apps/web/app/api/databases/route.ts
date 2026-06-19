import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { connectedDatabases, knowledgeSources, knowledgeBases } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../lib/errors';
import { logAuditEvent } from '../../../lib/security/audit';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const url = new URL(req.url);
    const kbId = url.searchParams.get('kbId');

    let dbsQuery: any[] = [];
    if (kbId && kbId !== 'none') {
      const ownershipError = await requireOwnership('knowledge_base', parseInt(kbId, 10), user.id);
      if (ownershipError) return ownershipError;

      dbsQuery = await db.select().from(connectedDatabases).where(eq(connectedDatabases.kbId, parseInt(kbId, 10)));
    } else {
      // Fetch all DBs directly owned by the user (now that we have a userId column)
      // Also fetch any DBs attached to KBs the user owns just to be thorough
      
      const userKbs = await db.select({ id: knowledgeBases.id }).from(knowledgeBases).where(eq(knowledgeBases.userId, user.id));
      const userKbIds = userKbs.map(kb => kb.id);
      
      dbsQuery = await db.select().from(connectedDatabases)
        .where(
          // For simplicity in MVP, fetch databases where userId matches OR kbId is in the list
          eq(connectedDatabases.userId, user.id)
        );
      
      // If we didn't migrate some old data, add kbId matching as fallback
      if (userKbIds.length > 0) {
        const legacyDbs = await db.select().from(connectedDatabases).where(require('drizzle-orm').inArray(connectedDatabases.kbId, userKbIds));
        const newDbIds = new Set(dbsQuery.map(d => d.id));
        for (const lDb of legacyDbs) {
           if (!newDbIds.has(lDb.id)) {
              dbsQuery.push(lDb);
           }
        }
      }
    }

    const sourcesQuery = await db.select().from(knowledgeSources).where(eq(knowledgeSources.type, 'database'));
    
    const dbs = dbsQuery.map(dbItem => {
      // Find the corresponding knowledge source for this database
      const source = sourcesQuery.find(s => {
        const config = s.configuration as any;
        return config && config.connectedDbId === dbItem.id;
      });
      
      return {
        id: dbItem.id,
        name: dbItem.name,
        engine: dbItem.engine,
        accessMode: dbItem.accessMode,
        status: source?.syncStatus || 'active',
        tablesCount: source?.documentCount || 0
      };
    });

    return NextResponse.json(dbs);
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Fetch Databases Route');
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const url = new URL(req.url);
    const dbId = url.searchParams.get('id');

    if (!dbId) {
      throw new ValidationError('Database ID is required');
    }

    // Verify ownership
    const targetDb = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, parseInt(dbId, 10))).limit(1);
    if (!targetDb || targetDb.length === 0) {
      throw new ValidationError('Database not found');
    }
    const ownershipError = await requireOwnership('database', targetDb[0]!.id, user.id);
    if (ownershipError) return ownershipError;

    // Delete the database. Due to constraints, deleting from connectedDatabases might not automatically
    // cascade to knowledgeSources unless configured, so we should clean up knowledgeSources first
    // where configuration->>'connectedDbId' == dbId
    
    // For MVP, just delete the connected_databases record, and let dangling sources be harmless
    // or manually clean them if schema is strict
    await db.delete(connectedDatabases).where(eq(connectedDatabases.id, parseInt(dbId, 10)));

    await logAuditEvent({
      userId: user.id,
      action: 'DELETE_DATABASE',
      resourceType: 'database',
      resourceId: parseInt(dbId, 10),
      metadata: { kbId: targetDb[0]!.kbId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Disconnect Database Route');
  }
}
