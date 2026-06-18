import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { databaseSchemas, connectedDatabases } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../../lib/errors';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;
    const resolvedParams = await params;
    const dbId = parseInt(resolvedParams.id, 10);

    const targetDb = await db.select().from(connectedDatabases).where(eq(connectedDatabases.id, dbId)).limit(1);
    if (!targetDb || targetDb.length === 0) {
      throw new ValidationError('Database not found');
    }

    const ownershipError = await requireOwnership('knowledge_base', targetDb[0]!.kbId as number, user.id);
    if (ownershipError) return ownershipError;

    const schemas = await db.select().from(databaseSchemas).where(eq(databaseSchemas.databaseId, dbId));
    
    if (schemas.length === 0) {
      return NextResponse.json({ schema: {} });
    }

    return NextResponse.json({ schema: schemas[0]!.schemaData });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Get Database Schema Route');
  }
}
