import { headers } from 'next/headers';
import { db } from '../../db';
import { auditLogs } from '../../db/schema';

type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREDENTIAL_ROTATION'
  | 'EXPORT'
  | 'SYNC_TRIGGERED'
  | 'ROLE_CHANGE';

export async function logAuditEvent({
  userId,
  action,
  resourceType,
  resourceId,
  metadata = {},
}: {
  userId: string;
  action: AuditAction | string;
  resourceType?: string;
  resourceId?: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const headersList = await headers();
    const ipAddress = (headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown') as string;
    const userAgent = (headersList.get('user-agent') || 'unknown') as string;

    await db.insert(auditLogs).values({
      userId,
      action,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      ipAddress: (ipAddress.split(',')[0] || '').trim(),
      userAgent: userAgent.substring(0, 255),
      metadata,
    });
  } catch (error) {
    // Audit logging should never break the main application flow
    console.error('[AuditLogger] Failed to write audit log:', error);
  }
}
