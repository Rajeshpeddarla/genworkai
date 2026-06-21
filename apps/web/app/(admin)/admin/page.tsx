import { db } from "@/db";
import { count, eq, gte, sql } from "drizzle-orm";
import { 
  profiles, 
  knowledgeBases, 
  connectedDatabases, 
  automationTasks, 
  workspaceArtifacts, 
  tickets, 
  apiUsageLogs,
  subscriptionPlans
} from "@/db/schema";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminOverviewDashboard() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalUsersRes = await db.select({ value: count() }).from(profiles);
  const totalKbsRes = await db.select({ value: count() }).from(knowledgeBases);
  const totalDbsRes = await db.select({ value: count() }).from(connectedDatabases);
  const totalAutomationsRes = await db.select({ value: count() }).from(automationTasks);
  const totalArtifactsRes = await db.select({ value: count() }).from(workspaceArtifacts);
  const openTicketsRes = await db.select({ value: count() }).from(tickets).where(eq(tickets.status, 'open'));
  const apiUsageRes = await db.select({ requests: count() }).from(apiUsageLogs);
  const mcpUsageRes = await db.select({ requests: count() }).from(apiUsageLogs).where(eq(apiUsageLogs.resourceType, 'mcp'));
  const newSignupsRes = await db.select({ value: count() }).from(profiles).where(gte(profiles.createdAt, sevenDaysAgo));
  const activeUsersWithPlans = await db.select({ tier: profiles.tier }).from(profiles).where(eq(profiles.isActive, true));
  const allPlans = await db.select().from(subscriptionPlans);

  let totalRevenueCents = 0;
  activeUsersWithPlans.forEach(user => {
    const plan = allPlans.find(p => p.slug === user.tier);
    if (plan) {
      totalRevenueCents += (plan.monthlyPrice || 0);
    }
  });

  const totalUsers = totalUsersRes[0]?.value || 0;

  const stats = {
    totalUsers,
    activeUsersToday: Math.floor(totalUsers * 0.1) || 1, // Approximation
    totalKbs: totalKbsRes[0]?.value || 0,
    totalDbs: totalDbsRes[0]?.value || 0,
    totalAutomations: totalAutomationsRes[0]?.value || 0,
    totalArtifacts: totalArtifactsRes[0]?.value || 0,
    totalApiRequests: apiUsageRes[0]?.requests || 0,
    totalMcpRequests: mcpUsageRes[0]?.requests || 0,
    openTickets: openTicketsRes[0]?.value || 0,
    revenue: totalRevenueCents / 100, // Converted to dollars
    newSignups: newSignupsRes[0]?.value || 0,
    // Chart data is mocked until we have enough time-series data
    userGrowthData: [
      { name: 'Mon', users: totalUsers - 6 }, { name: 'Tue', users: totalUsers - 5 }, { name: 'Wed', users: totalUsers - 4 },
      { name: 'Thu', users: totalUsers - 3 }, { name: 'Fri', users: totalUsers - 2 }, { name: 'Sat', users: totalUsers - 1 }, { name: 'Sun', users: totalUsers }
    ],
    subscriptionData: [
      { name: 'Free', value: totalUsers }, { name: 'Starter', value: 0 }, 
      { name: 'Pro', value: 0 }, { name: 'Agency', value: 0 }, { name: 'Enterprise', value: 0 }
    ],
    apiTrendsData: [
      { name: 'Week 1', tokens: 120, apiCalls: 45 }, { name: 'Week 2', tokens: 150, apiCalls: 55 },
      { name: 'Week 3', tokens: 180, apiCalls: 70 }, { name: 'Week 4', tokens: 210, apiCalls: 85 }
    ],
    countryData: [
      { name: 'USA', users: 650 }, { name: 'UK', users: 220 }, 
      { name: 'India', users: 380 }, { name: 'Canada', users: 120 }, { name: 'Australia', users: 50 }
    ]
  };

  return <AdminDashboardClient stats={stats} />;
}
