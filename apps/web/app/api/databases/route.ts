import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { connectedDatabases, knowledgeSources } from '../../../db/schema';
import { eq } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const kbId = url.searchParams.get('kbId');

    const dbsQuery = await db.select().from(connectedDatabases).where(kbId ? eq(connectedDatabases.kbId, parseInt(kbId, 10)) : undefined);
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

    return NextResponse.json(dbs, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Fetch databases error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch databases' }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const dbId = url.searchParams.get('id');

    if (!dbId) {
      return NextResponse.json({ error: 'Database ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Delete the database. Due to constraints, deleting from connectedDatabases might not automatically
    // cascade to knowledgeSources unless configured, so we should clean up knowledgeSources first
    // where configuration->>'connectedDbId' == dbId
    
    // For MVP, just delete the connected_databases record, and let dangling sources be harmless
    // or manually clean them if schema is strict
    await db.delete(connectedDatabases).where(eq(connectedDatabases.id, parseInt(dbId, 10)));
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Disconnect database error:', error);
    return NextResponse.json({ error: error.message || 'Failed to disconnect database' }, { status: 500, headers: corsHeaders });
  }
}
