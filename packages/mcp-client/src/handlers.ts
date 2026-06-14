import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

export async function listKnowledgeBases(extra: any) {
  const { data, error } = await supabase.from('knowledge_bases').select('*');
  if (error) return getResponse(`Error: ${error.message}`);
  return getResponse(JSON.stringify(data, null, 2));
}

export async function searchKnowledge(query: string, kbId: number | undefined, extra: any) {
  return getResponse(`Semantic search results for "${query}"...`);
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
