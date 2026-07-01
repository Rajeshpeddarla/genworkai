import { db } from "@/db";
import { aiUsageHistory, billingEvents, userAiCreditPurchases, profiles, aiCreditLedger, knowledgeBases, connectedDatabases, automationTasks } from "@/db/schema";
import AnalyticsClient from "./AnalyticsClient";
import { sql, eq } from "drizzle-orm";

export default async function AnalyticsPage() {
  
  // 1. Total Stats
  const revenueResult = await db.select({ total: sql<number>`sum(${billingEvents.amount})` })
    .from(billingEvents)
    .where(eq(billingEvents.eventType, 'payment_success'));
    
  const issuedResult = await db.select({ total: sql<number>`sum(${userAiCreditPurchases.purchasedCredits})` })
    .from(userAiCreditPurchases);
    
  const consumedResult = await db.select({ total: sql<number>`sum(${aiUsageHistory.creditsUsed})` })
    .from(aiUsageHistory);

  const stats = {
    totalRevenue: revenueResult[0]?.total || 0,
    totalCreditsIssued: issuedResult[0]?.total || 0,
    totalCreditsConsumed: consumedResult[0]?.total || 0
  };

  // 2. Revenue Over Time (Daily)
  const revenueQuery = await db.execute(sql`
    SELECT date_trunc('day', created_at) as date, sum(amount) as amount
    FROM ${billingEvents}
    WHERE event_type = 'payment_success'
    GROUP BY 1
    ORDER BY 1 ASC
    LIMIT 30
  `);
  const revenueByDay = revenueQuery.rows.map((row: any) => ({
    date: new Date(row.date).toLocaleDateString(),
    amount: Number(row.amount)
  }));

  // 3. Credits Issued vs Consumed
  const issuedQuery = await db.execute(sql`
    SELECT date_trunc('day', created_at) as date, sum(purchased_credits) as issued
    FROM ${userAiCreditPurchases}
    GROUP BY 1
  `);
  
  const consumedQuery = await db.execute(sql`
    SELECT date_trunc('day', created_at) as date, sum(credits_used) as consumed
    FROM ${aiUsageHistory}
    GROUP BY 1
  `);
  
  const datesMap = new Map<string, { issued: number, consumed: number }>();
  issuedQuery.rows.forEach((row: any) => {
    const d = new Date(row.date).toLocaleDateString();
    datesMap.set(d, { issued: Number(row.issued), consumed: 0 });
  });
  
  consumedQuery.rows.forEach((row: any) => {
    const d = new Date(row.date).toLocaleDateString();
    const existing = datesMap.get(d) || { issued: 0, consumed: 0 };
    existing.consumed = Number(row.consumed);
    datesMap.set(d, existing);
  });
  
  const creditsByDay = Array.from(datesMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 4. Top Customers
  const customersQuery = await db.execute(sql`
    SELECT p.id, p.full_name, p.email, 
           COALESCE(SUM(u.credits_used), 0) as consumed,
           COALESCE(SUM(c.purchased_credits), 0) as issued
    FROM ${profiles} p
    LEFT JOIN ${aiUsageHistory} u ON p.id = u.user_id
    LEFT JOIN ${userAiCreditPurchases} c ON p.id = c.user_id
    GROUP BY p.id, p.full_name, p.email
    ORDER BY consumed DESC, issued DESC
    LIMIT 10
  `);
  
  const topCustomers = customersQuery.rows.map((row: any) => ({
    userId: row.id,
    fullName: row.full_name,
    email: row.email,
    consumed: Number(row.consumed),
    issued: Number(row.issued)
  }));

  // 5. Most Popular Packs (by credits size)
  const popularPacksQuery = await db.execute(sql`
    SELECT purchased_credits as size, COUNT(*) as count, SUM(purchased_credits) as total_credits
    FROM ${userAiCreditPurchases}
    GROUP BY purchased_credits
    ORDER BY count DESC
    LIMIT 5
  `);
  
  const popularPacks = popularPacksQuery.rows.map((row: any) => ({
    name: `${row.size.toLocaleString()} Credits Pack`,
    totalCredits: Number(row.total_credits)
  }));

  // 6. Most Expensive Operations
  const expensiveOpsQuery = await db.execute(sql`
    SELECT operation_key as operation, SUM(ABS(amount)) as total_cost
    FROM ${aiCreditLedger}
    WHERE amount < 0
    GROUP BY operation_key
    ORDER BY total_cost DESC
    LIMIT 5
  `);
  
  const expensiveOperations = expensiveOpsQuery.rows.map((row: any) => ({
    operation: row.operation,
    totalCost: Number(row.total_cost)
  }));

  // 7. Heavy Resource Users
  const heavyUsersQuery = await db.execute(sql`
    SELECT p.id, p.full_name as name, p.email,
           (SELECT COUNT(*) FROM ${knowledgeBases} kb WHERE kb.user_id = p.id) as kb_count,
           (SELECT COUNT(*) FROM ${connectedDatabases} db WHERE db.user_id = p.id) as db_count,
           (SELECT COUNT(*) FROM ${automationTasks} a WHERE a.user_id = p.id) as auto_count
    FROM ${profiles} p
    ORDER BY (kb_count + db_count + auto_count) DESC
    LIMIT 10
  `);
  
  const heavyResourceUsers = heavyUsersQuery.rows.map((row: any) => ({
    userId: row.id,
    name: row.name || 'Unknown',
    email: row.email,
    kbCount: Number(row.kb_count),
    dbCount: Number(row.db_count),
    autoCount: Number(row.auto_count),
    totalResources: Number(row.kb_count) + Number(row.db_count) + Number(row.auto_count)
  }));

  return (
    <AnalyticsClient 
      stats={stats} 
      revenueByDay={revenueByDay} 
      creditsByDay={creditsByDay} 
      topCustomers={topCustomers} 
      popularPacks={popularPacks}
      expensiveOperations={expensiveOperations}
      heavyResourceUsers={heavyResourceUsers}
    />
  );
}
