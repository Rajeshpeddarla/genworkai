import { db } from "@/db";
import { adminAuditLogs, profiles } from "@/db/schema";
import SettingsClient from "./SettingsClient";
import { desc, eq } from "drizzle-orm";

export default async function SettingsPage() {
  const logs = await db
    .select({
      id: adminAuditLogs.id,
      adminName: profiles.fullName,
      adminEmail: profiles.email,
      action: adminAuditLogs.action,
      entityType: adminAuditLogs.entityType,
      entityId: adminAuditLogs.entityId,
      createdAt: adminAuditLogs.createdAt,
      newValue: adminAuditLogs.newValue,
    })
    .from(adminAuditLogs)
    .leftJoin(profiles, eq(adminAuditLogs.adminId, profiles.id))
    .orderBy(desc(adminAuditLogs.createdAt));

  return <SettingsClient initialLogs={logs} />;
}
