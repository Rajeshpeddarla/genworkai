"use server";

import { db } from "@/db";
import { ticketMessages, tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTicket(userId: string, data: any) {
  const [newTicket] = await db.insert(tickets).values({
    userId,
    type: data.type,
    subject: data.subject,
    message: data.message, // Initial message
    priority: data.priority,
    status: 'open'
  }).returning({ id: tickets.id });

  if (!newTicket) {
    throw new Error("Failed to create ticket");
  }

  // Add the initial message to the messages table as well
  await db.insert(ticketMessages).values({
    ticketId: newTicket.id,
    senderId: userId,
    isAgent: false,
    content: data.message,
  });

  revalidatePath('/support');
  revalidatePath('/admin/tickets');
}

export async function replyToUserTicket(ticketId: string, senderId: string, content: string) {
  await db.insert(ticketMessages).values({
    ticketId,
    senderId,
    isAgent: false, // user replying
    content,
  });

  revalidatePath('/support');
  revalidatePath('/admin/tickets');
}
