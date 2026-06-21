import { db } from "@/db";
import { profiles, apiUsageCounters } from "@/db/schema";
import { desc } from "drizzle-orm";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const users = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
  const usage = await db.select().from(apiUsageCounters);

  const enrichedUsers = users.map(u => {
    const userUsage = usage.filter(us => us.userId === u.id);
    const totalRequests = userUsage.reduce((acc, curr) => acc + (curr.requests || 0), 0);
    const daysSinceSignup = Math.floor((Date.now() - new Date(u.createdAt!).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...u,
      totalRequests,
      daysInactive: daysSinceSignup
    };
  }).sort((a, b) => b.totalRequests - a.totalRequests); // Top users first

  return <UsersClient initialUsers={enrichedUsers} />;
}

