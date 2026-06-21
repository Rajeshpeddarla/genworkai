import { db } from "@/db";
import { tickets, ticketMessages } from "@/db/schema";
import SupportClient from "./SupportClient";
import { desc, eq, inArray, asc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch only this user's tickets
  const userTickets = await db
    .select()
    .from(tickets)
    .where(eq(tickets.userId, user.id))
    .orderBy(desc(tickets.createdAt));

  const ticketIds = userTickets.map(t => t.id);
  
  // Fetch messages for these tickets
  let allMessages: any[] = [];
  if (ticketIds.length > 0) {
    allMessages = await db
      .select()
      .from(ticketMessages)
      .where(inArray(ticketMessages.ticketId, ticketIds))
      .orderBy(asc(ticketMessages.createdAt));
  }

  const enrichedTickets = userTickets.map(t => ({
    ...t,
    messages: allMessages.filter(m => m.ticketId === t.id)
  }));

  return <SupportClient initialTickets={enrichedTickets} currentUserId={user.id} />;
}
