export type AutomationCategory = 'knowledge' | 'documentation' | 'developer' | 'database' | 'monitoring' | 'workspace';

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  defaultArtifactTypes: string[];
  supportedSources: string[];
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "knowledge_digest",
    name: "Daily Knowledge Digest",
    description: "Generate a daily learning or knowledge summary from your connected sources.",
    category: "knowledge",
    defaultArtifactTypes: ["document", "presentation"],
    supportedSources: ["knowledge_base", "github", "website"]
  },
  {
    id: "knowledge_assessment",
    name: "Knowledge Assessment",
    description: "Generate quizzes, assessments, and evaluation content from your knowledge base.",
    category: "knowledge",
    defaultArtifactTypes: ["assessment", "quiz", "document"],
    supportedSources: ["knowledge_base"]
  },
  {
    id: "knowledge_review",
    name: "Knowledge Review Cycle",
    description: "Generate recurring review materials and revision notes.",
    category: "knowledge",
    defaultArtifactTypes: ["document", "report"],
    supportedSources: ["knowledge_base"]
  },
  {
    id: "documentation_refresh",
    name: "Documentation Refresh",
    description: "Refresh outdated documentation, technical guides, or SOPs.",
    category: "documentation",
    defaultArtifactTypes: ["document"],
    supportedSources: ["github", "knowledge_base", "api"]
  },
  {
    id: "architecture_review",
    name: "Architecture Review",
    description: "Generate architecture insights, dependency graphs, and structural reports.",
    category: "developer",
    defaultArtifactTypes: ["report", "document"],
    supportedSources: ["github", "knowledge_base", "database"]
  },
  {
    id: "test_asset_generation",
    name: "Test Asset Generation",
    description: "Generate testing assets, mock data, and validation scripts.",
    category: "developer",
    defaultArtifactTypes: ["document", "spreadsheet"],
    supportedSources: ["github", "api"]
  },
  {
    id: "release_summary",
    name: "Release Summary",
    description: "Summarize code changes, commits, and PRs into release notes.",
    category: "developer",
    defaultArtifactTypes: ["document", "report"],
    supportedSources: ["github"]
  },
  {
    id: "data_audit",
    name: "Data Audit",
    description: "Audit connected databases for missing data, consistency, and quality.",
    category: "database",
    defaultArtifactTypes: ["report", "spreadsheet"],
    supportedSources: ["database"]
  },
  {
    id: "operational_report",
    name: "Operational Report",
    description: "Generate comprehensive business and operational reports.",
    category: "database", // keeping it database/monitoring
    defaultArtifactTypes: ["report", "presentation"],
    supportedSources: ["database", "knowledge_base"]
  },
  {
    id: "monitoring_alerts",
    name: "Monitoring & Alerts",
    description: "Monitor changes and generate impact analysis reports.",
    category: "monitoring",
    defaultArtifactTypes: ["report"],
    supportedSources: ["database", "github", "api"]
  },
  {
    id: "artifact_generator",
    name: "Artifact Generator",
    description: "Generate new artifacts directly from existing knowledge and past artifacts.",
    category: "workspace",
    defaultArtifactTypes: ["document", "presentation", "spreadsheet"],
    supportedSources: ["knowledge_base", "artifact"]
  },
  {
    id: "custom_workflow",
    name: "Custom Workflow",
    description: "User-defined custom automation workflow combining any source and output.",
    category: "workspace",
    defaultArtifactTypes: ["document"],
    supportedSources: ["any"]
  }
];
