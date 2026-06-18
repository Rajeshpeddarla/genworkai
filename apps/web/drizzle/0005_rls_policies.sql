-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_flows ENABLE ROW LEVEL SECURITY;

-- 1. Profiles (Direct user_id)
CREATE POLICY "Users can access own profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- 2. Knowledge Bases (Direct user_id)
CREATE POLICY "Users can access own KBs" ON knowledge_bases
  FOR ALL USING (user_id = auth.uid());

-- 3. Documents (Indirect via kb_id)
CREATE POLICY "Users can access own documents" ON documents
  FOR ALL USING (
    kb_id IN (SELECT id FROM knowledge_bases WHERE user_id = auth.uid())
  );

-- 4. Document Chunks (Indirect via document_id)
CREATE POLICY "Users can access own document chunks" ON document_chunks
  FOR ALL USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN knowledge_bases k ON d.kb_id = k.id
      WHERE k.user_id = auth.uid()
    )
  );

-- 5. Workspace Chats (Direct user_id)
CREATE POLICY "Users can access own chats" ON workspace_chats
  FOR ALL USING (user_id = auth.uid());

-- 6. Workspace Messages (Indirect via chat_id)
CREATE POLICY "Users can access own messages" ON workspace_messages
  FOR ALL USING (
    chat_id IN (SELECT id FROM workspace_chats WHERE user_id = auth.uid())
  );

-- 7. Workspace Artifacts (Indirect via chat_id)
CREATE POLICY "Users can access own artifacts" ON workspace_artifacts
  FOR ALL USING (
    chat_id IN (SELECT id FROM workspace_chats WHERE user_id = auth.uid())
  );

-- 8. Workspace Artifact Versions (Indirect via artifact_id)
CREATE POLICY "Users can access own artifact versions" ON workspace_artifact_versions
  FOR ALL USING (
    artifact_id IN (
      SELECT a.id FROM workspace_artifacts a
      JOIN workspace_chats c ON a.chat_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- 9. Knowledge Sources (Indirect via kb_id)
CREATE POLICY "Users can access own sources" ON knowledge_sources
  FOR ALL USING (
    kb_id IN (SELECT id FROM knowledge_bases WHERE user_id = auth.uid())
  );

-- 10. Source Snapshots (Indirect via source_id)
CREATE POLICY "Users can access own source snapshots" ON source_snapshots
  FOR ALL USING (
    source_id IN (
      SELECT s.id FROM knowledge_sources s
      JOIN knowledge_bases k ON s.kb_id = k.id
      WHERE k.user_id = auth.uid()
    )
  );

-- 11. Sync Jobs (Indirect via source_id)
CREATE POLICY "Users can access own sync jobs" ON sync_jobs
  FOR ALL USING (
    source_id IN (
      SELECT s.id FROM knowledge_sources s
      JOIN knowledge_bases k ON s.kb_id = k.id
      WHERE k.user_id = auth.uid()
    )
  );

-- 12. Connected Databases (Indirect via kb_id)
CREATE POLICY "Users can access own connected DBs" ON connected_databases
  FOR ALL USING (
    kb_id IN (SELECT id FROM knowledge_bases WHERE user_id = auth.uid())
  );

-- 13. Database Schemas (Indirect via database_id)
CREATE POLICY "Users can access own database schemas" ON database_schemas
  FOR ALL USING (
    database_id IN (
      SELECT db.id FROM connected_databases db
      JOIN knowledge_bases k ON db.kb_id = k.id
      WHERE k.user_id = auth.uid()
    )
  );

-- 14. Automation Tasks (Direct user_id)
CREATE POLICY "Users can access own automation tasks" ON automation_tasks
  FOR ALL USING (user_id = auth.uid());

-- 15. Automation Logs (Indirect via task_id)
CREATE POLICY "Users can access own automation logs" ON automation_logs
  FOR ALL USING (
    task_id IN (SELECT id FROM automation_tasks WHERE user_id = auth.uid())
  );

-- 16. MCP Servers (Direct user_id)
CREATE POLICY "Users can access own MCP servers" ON mcp_servers
  FOR ALL USING (user_id = auth.uid());

-- 17. MCP API Keys (Indirect via server_id)
CREATE POLICY "Users can access own MCP keys" ON mcp_api_keys
  FOR ALL USING (
    server_id IN (SELECT id FROM mcp_servers WHERE user_id = auth.uid())
  );

-- 18. MCP Audit Logs (Indirect via server_id)
CREATE POLICY "Users can access own MCP audit logs" ON mcp_audit_logs
  FOR ALL USING (
    server_id IN (SELECT id FROM mcp_servers WHERE user_id = auth.uid())
  );

-- 19. Business Features (Indirect via kb_id)
CREATE POLICY "Users can access own business features" ON business_features
  FOR ALL USING (
    kb_id IN (SELECT id FROM knowledge_bases WHERE user_id = auth.uid())
  );

-- 20. Business Flows (Indirect via kb_id)
CREATE POLICY "Users can access own business flows" ON business_flows
  FOR ALL USING (
    kb_id IN (SELECT id FROM knowledge_bases WHERE user_id = auth.uid())
  );
