"use server";

import { db } from "@/db";
import { ticketMessages, tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function replyToTicket(ticketId: string, senderId: string, content: string) {
  await db.insert(ticketMessages).values({
    ticketId,
    senderId,
    isAgent: true, // admin replying
    content,
  });

  // Ensure status is updated if it was resolved? Keep it simple for now.
  revalidatePath('/admin/tickets');
  revalidatePath('/support');
}

export async function markTicketResolved(ticketId: string) {
  await db.update(tickets).set({ status: 'resolved' }).where(eq(tickets.id, ticketId));
  revalidatePath('/admin/tickets');
  revalidatePath('/support');
}
