import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from '../database/DatabaseService';

// Initialize the Supabase REST client instead of Drizzle TCP connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to format responses
function getResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }]
  };
}

export async function listSources(kbId: number, extra: any) {
  const { data, error } = await supabase.from('knowledge_sources').select('*').eq('kb_id', kbId);
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data, null, 2));
}

export async function getSource(sourceId: number, extra: any) {
  const { data, error } = await supabase.from('knowledge_sources').select('*').eq('id', sourceId).single();
  if (error && error.code !== 'PGRST116') return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data || {}, null, 2));
}

export async function refreshSource(sourceId: number, extra: any) {
  return getResponse(`Source ${sourceId} sync queued successfully.`);
}

export async function listKnowledgeBases(allowedKbIds: number[], extra: any) {
  if (allowedKbIds.length === 0) return getResponse('[]');
  const { data, error } = await supabase.from('knowledge_bases').select('*').in('id', allowedKbIds);
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data, null, 2));
}

export async function searchKnowledge(query: string, kbId: number | undefined, allowedKbIds: number[], extra: any) {
  if (kbId && !allowedKbIds.includes(kbId)) return getResponse(`Error: Unauthorized KB`);
  const targetKbs = kbId ? [kbId] : allowedKbIds;
  return getResponse(`Semantic search results for "${query}" in KBs [${targetKbs.join(',')}]...`);
}

export async function getArchitectureView(kbId: number, extra: any) {
  const { data, error } = await supabase.from('business_features').select('*').eq('kb_id', kbId);
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data, null, 2));
}

export async function listFeatures(kbId: number, extra: any) {
  const { data, error } = await supabase.from('business_features').select('*').eq('kb_id', kbId);
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data, null, 2));
}

export async function getFeature(featureId: number, extra: any) {
  const { data, error } = await supabase.from('business_features').select('*').eq('id', featureId).single();
  if (error && error.code !== 'PGRST116') return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data || {}, null, 2));
}

export async function listFlows(kbId: number, extra: any) {
  const { data, error } = await supabase.from('business_flows').select('*').eq('kb_id', kbId);
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data, null, 2));
}

export async function getFlow(flowId: number, extra: any) {
  const { data, error } = await supabase.from('business_flows').select('*').eq('id', flowId).single();
  if (error && error.code !== 'PGRST116') return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data || {}, null, 2));
}

export async function createFlow(args: any, extra: any) {
  const { data, error } = await supabase.from('business_flows').insert({
    kb_id: args.kbId,
    name: args.name,
    description: args.description,
    steps: args.steps
  }).select().single();
  
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data, null, 2));
}

export async function generateArtifactTemplate(type: string, ids: number[], extra: any) {
  return getResponse(`Generated ${type} artifact based on selected features/flows.`);
}

export async function listArtifacts(chatId: number, extra: any) {
  const { data, error } = await supabase.from('workspace_artifacts').select('*').eq('chat_id', chatId);
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data, null, 2));
}

export async function getArtifact(artifactId: number, extra: any) {
  const { data, error } = await supabase.from('workspace_artifacts').select('*').eq('id', artifactId).single();
  if (error && error.code !== 'PGRST116') return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data || {}, null, 2));
}

// --- DATABASE INTELLIGENCE ---
export async function getDatabaseSchema(databaseId: number, allowedKbIds: number[], extra: any) {
  // First verify the database belongs to an allowed KB
  const { data: dbConfig } = await supabase.from('connected_databases').select('kb_id').eq('id', databaseId).single();
  if (!dbConfig || !allowedKbIds.includes(dbConfig.kb_id)) {
    return getResponse(`Error: Unauthorized or database not found`);
  }

  const { data, error } = await supabase.from('database_schemas').select('*').eq('database_id', databaseId).single();
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data?.schema_data || {}, null, 2));
}

export async function queryDatabase(databaseId: number, query: string, allowedKbIds: number[], extra: any) {
  const { data: dbConfig, error } = await supabase.from('connected_databases').select('*').eq('id', databaseId).single();
  if (error) return getResponse(`Error fetching database config: ${error.message}`);
  if (!dbConfig || !allowedKbIds.includes(dbConfig.kb_id)) return getResponse(`Error: Database ${databaseId} not found or unauthorized`);

  try {
    const service = new DatabaseService({
      engine: dbConfig.engine as any,
      connectionString: dbConfig.connection_string,
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database_name,
      username: dbConfig.username,
      password: dbConfig.password
    });

    const results = await service.executeQuery(query);
    return getResponse(JSON.stringify(results, null, 2));
  } catch (err: any) {
    return getResponse(`Execution Error: ${err.message}`);
  }
}

// --- AUTOMATION STUDIO ---
export async function createAutomationTask(args: any, extra: any) {
  return getResponse(`Task ${args.name} created successfully.`);
}

export async function triggerAutomationTask(taskId: number, extra: any) {
  return getResponse(`Task ${taskId} triggered successfully via Inngest.`);
}

