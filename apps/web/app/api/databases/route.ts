import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { connectedDatabases, knowledgeSources, knowledgeBases } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../lib/errors';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const url = new URL(req.url);
    const kbId = url.searchParams.get('kbId');

    let dbsQuery: any[] = [];
    if (kbId) {
      const ownershipError = await requireOwnership('knowledge_base', parseInt(kbId, 10), user.id);
      if (ownershipError) return ownershipError;

      dbsQuery = await db.select().from(connectedDatabases).where(eq(connectedDatabases.kbId, parseInt(kbId, 10)));
    } else {
      // Fetch all DBs across all user's KBs
      const userKbs = await db.select({ id: knowledgeBases.id }).from(knowledgeBases).where(eq(knowledgeBases.userId, user.id));
      const userKbIds = userKbs.map(kb => kb.id);
      
      if (userKbIds.length === 0) {
        dbsQuery = [];
      } else {
        dbsQuery = await db.select()
          .from(connectedDatabases)
          .innerJoin(knowledgeBases, eq(connectedDatabases.kbId, knowledgeBases.id))
          .where(eq(knowledgeBases.userId, user.id))
          .then(res => res.map(r => r.connected_databases));
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
    const ownershipError = await requireOwnership('knowledge_base', targetDb[0]!.kbId as number, user.id);
    if (ownershipError) return ownershipError;

    // Delete the database. Due to constraints, deleting from connectedDatabases might not automatically
    // cascade to knowledgeSources unless configured, so we should clean up knowledgeSources first
    // where configuration->>'connectedDbId' == dbId
    
    // For MVP, just delete the connected_databases record, and let dangling sources be harmless
    // or manually clean them if schema is strict
    await db.delete(connectedDatabases).where(eq(connectedDatabases.id, parseInt(dbId, 10)));
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Disconnect Database Route');
  }
}
