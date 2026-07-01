import { createClient } from '../../../../utils/supabase/server';
import { db } from '../../../../db';
import { apiKeys, knowledgeBases, connectedDatabases, automationTasks, mcpServers, workspaceChats } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import PlaygroundClient from './PlaygroundClient';

export const dynamic = 'force-dynamic';

export default async function DeveloperPlaygroundPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) redirect('/login');

  // Fetch API keys and resources in parallel
  const [
    keys,
    kbs,
    dbs,
    automations,
    mcps,
    chats
  ] = await Promise.all([
    db.select().from(apiKeys).where(and(eq(apiKeys.userId, session.user.id), eq(apiKeys.status, 'active'))),
    db.select({ id: knowledgeBases.id, name: knowledgeBases.name }).from(knowledgeBases).where(eq(knowledgeBases.userId, session.user.id)),
    db.select({ id: connectedDatabases.id, name: connectedDatabases.name }).from(connectedDatabases).where(eq(connectedDatabases.userId, session.user.id)),
    db.select({ id: automationTasks.id, name: automationTasks.name }).from(automationTasks).where(eq(automationTasks.userId, session.user.id)),
    db.select({ id: mcpServers.id, name: mcpServers.name }).from(mcpServers).where(eq(mcpServers.userId, session.user.id)),
    db.select({ id: workspaceChats.id, title: workspaceChats.title }).from(workspaceChats).where(eq(workspaceChats.userId, session.user.id))
  ]);
  
  // Fetch OpenAPI Spec
  let openapi = null;
  try {
    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${host}/api/openapi.json`, { cache: 'no-store' });
    if (res.ok) {
      openapi = await res.json();
    }
  } catch (err) {}

  const resources = {
    kbId: kbs,
    dbId: dbs,
    automationId: automations,
    mcpServerId: mcps,
    chatId: chats.map(c => ({ id: c.id, name: c.title }))
  };

  return (
    <div className="h-full">
      <PlaygroundClient initialKeys={keys} initialSpec={openapi} resources={resources} userId={session.user.id} />
    </div>
  );
}
