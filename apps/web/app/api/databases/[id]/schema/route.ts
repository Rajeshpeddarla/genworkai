import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { databaseSchemas } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const dbId = parseInt(resolvedParams.id, 10);

    const schemas = await db.select().from(databaseSchemas).where(eq(databaseSchemas.databaseId, dbId));
    
    if (schemas.length === 0) {
      return NextResponse.json({ schema: {} });
    }

    return NextResponse.json({ schema: schemas[0]!.schemaData });
  } catch (error: any) {
    console.error('Schema fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch schema' }, { status: 500 });
  }
}
