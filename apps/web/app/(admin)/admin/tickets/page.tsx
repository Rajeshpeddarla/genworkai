import { db } from "@/db";
import { tickets, ticketMessages, profiles } from "@/db/schema";
import TicketsClient from "./TicketsClient";
import { desc, eq, inArray } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all tickets along with the user info who created them
  const allTickets = await db
    .select({
      id: tickets.id,
      subject: tickets.subject,
      message: tickets.message,
      priority: tickets.priority,
      status: tickets.status,
      createdAt: tickets.createdAt,
      userName: profiles.fullName,
      userEmail: profiles.email,
    })
    .from(tickets)
    .leftJoin(profiles, eq(tickets.userId, profiles.id))
    .orderBy(desc(tickets.createdAt));

  const ticketIds = allTickets.map(t => t.id);
  
  // Fetch messages for these tickets
  let allMessages: any[] = [];
  if (ticketIds.length > 0) {
    allMessages = await db
      .select()
      .from(ticketMessages)
      .where(inArray(ticketMessages.ticketId, ticketIds))
      .orderBy(asc(ticketMessages.createdAt));
  }

  const enrichedTickets = allTickets.map(t => ({
    ...t,
    messages: allMessages.filter(m => m.ticketId === t.id)
  }));

  return <TicketsClient initialTickets={enrichedTickets} currentUserId={user.id} />;
}

// We need asc here for chronological messages
import { asc } from "drizzle-orm";
