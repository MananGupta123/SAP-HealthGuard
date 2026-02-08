// SAP Log Schema - Types for SAP-shaped events

export type Severity = 'ERROR' | 'WARNING' | 'INFO';

export interface SapLog {
  logId: string;
  sourceSystem: string;
  application: string;
  module: string;
  severity: Severity;
  message: string;
  timestamp: string;
  month_end: boolean;
  changed_objects: string[];
  recent_deploys: string[];
}

// Alias for backward compatibility
export type SAPLogEntry = SapLog;

export interface Incident {
  incident_id: string;
  raw_log: SapLog | object;
  title: string;
  description: string;
  module: string;
  severity: Severity;
  timestamp: string;
  month_end: boolean;
  status?: 'open' | 'analyzing' | 'resolved' | 'escalated';
  created_at?: string;
}

export interface SystemMetrics {
  db_latency_ms: number;
  cpu_percent: number;
  memory_percent: number;
  active_users?: number;
  active_connections?: number;
}

export interface AnalysisResult {
  classification: string;
  probable_root_causes: string[];
  relevant_logs_snippet: string[];
  tags: string[];
  prompt_hash: string;
}

export interface SimilarIncident {
  incident_id: string;
  similarity_score: number;
  title?: string;
  resolution?: string;
  times_seen?: number;
  month_end_flag?: boolean;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  contributing_factors: string[];
  preventive_actions: string[];
  requires_escalation: boolean;
  // Aliases for backward compatibility
  top_risk_drivers?: string[];
  recommended_preventive_actions?: string[];
}

export interface PlaybookStep {
  step_id: string;
  action: string;
  command_or_API: string;
  expected_result: string;
  verification: string;
  rollback: string;
  escalate_required?: boolean;
}

export interface Playbook {
  title: string;
  steps: PlaybookStep[];
  required_permissions: string[];
  estimated_time_minutes: number;
  confidence: number;
  prompt_hash: string;
}

export interface ToolResult<T> {
  tool: string;
  result: T;
  audit_id: string;
}

export interface EscalationRecord {
  escalation_id: string;
  incident_id: string;
  reason: string;
  required_role: string;
  requester?: string;
  snapshot?: string;
  timestamp?: string;
  ack?: boolean;
}

export interface AuditRecord {
  audit_id: string;
  tool_name: string;
  input_hash: string;
  output_summary?: string;
  full_output?: string;
  timestamp?: string;
}

// Complete Analysis Output Schema
export interface OutputSchema {
  incident_id: string;
  agent_version: string;
  
  analysis: AnalysisResult;
  similar_incidents: SimilarIncident[];
  risk: RiskAssessment;
  playbook: Playbook;
  
  decision: 'PROCEED_WITH_PLAYBOOK' | 'ESCALATE_TO_HUMAN';
  
  escalation?: {
    escalation_id: string;
    reason: string;
    required_role: string;
  };
  
  audit_trail: {
    tool_calls: Array<{ tool: string; audit_id: string }>;
    prompt_hashes: {
      analysis: string;
      playbook: string;
    };
  };
}

// Legacy alias
export type AnalysisOutput = OutputSchema;
