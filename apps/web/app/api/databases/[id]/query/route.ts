import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { connectedDatabases } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { DatabaseService, DBConnectionConfig } from '../../../../../lib/database/DatabaseService';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { query } = await req.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const dbs = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, id));
    if (dbs.length === 0) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    const dbRecord = dbs[0]!;
    const config: DBConnectionConfig = {
      engine: dbRecord.engine as any,
      connectionString: dbRecord.connectionString || undefined,
      host: dbRecord.host || undefined,
      port: typeof dbRecord.port === 'number' ? dbRecord.port : (dbRecord.port ? parseInt(String(dbRecord.port), 10) : undefined),
      database: dbRecord.databaseName || undefined,
      username: dbRecord.username || undefined,
      password: dbRecord.password || undefined,
    };

    const dbService = new DatabaseService(config);
    const results = await dbService.executeQuery(query);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Query execution error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute query' }, { status: 500 });
  }
}
