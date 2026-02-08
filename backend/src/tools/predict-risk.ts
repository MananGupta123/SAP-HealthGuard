// Predict Risk Tool - Deterministic rule-based risk scoring
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { insertAuditRecord } from '../db/schema';
import { Incident, RiskAssessment, SystemMetrics, ToolResult } from '../types';

interface PredictRiskInput {
  incident: Incident;
  system_metrics: SystemMetrics;
  similar_count: number;
}

/**
 * Calculate risk score using deterministic rules
 * Returns score 0-1 and contributing factors
 */
export function predictRisk(input: PredictRiskInput): ToolResult<RiskAssessment> {
  const auditId = uuidv4();
  const inputHash = crypto.createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
    .substring(0, 16);

  let score = 0;
  const contributing_factors: string[] = [];
  const preventive_actions: string[] = [];

  // Rule 1: Month-end is high risk (+40 points)
  if (input.incident.month_end) {
    score += 40;
    contributing_factors.push('Month-end processing period - historically high incident rate');
    preventive_actions.push('Enable enhanced monitoring during month-end close');
  }

  // Rule 2: High DB latency (+20 points)
  if (input.system_metrics.db_latency_ms > 200) {
    score += 20;
    contributing_factors.push(`Elevated database latency: ${input.system_metrics.db_latency_ms}ms (threshold: 200ms)`);
    preventive_actions.push('Review database performance and consider index optimization');
  }

  // Rule 3: High CPU usage (+20 points)
  if (input.system_metrics.cpu_percent > 75) {
    score += 20;
    contributing_factors.push(`High CPU utilization: ${input.system_metrics.cpu_percent}% (threshold: 75%)`);
    preventive_actions.push('Scale compute resources or optimize batch job scheduling');
  }

  // Rule 4: Multiple similar incidents (+20 points)
  if (input.similar_count >= 3) {
    score += 20;
    contributing_factors.push(`Recurring issue pattern: ${input.similar_count} similar incidents found`);
    preventive_actions.push('Conduct root cause analysis to address underlying issue');
  }

  // Rule 5: Error severity (+10 points)
  if (input.incident.severity === 'ERROR') {
    score += 10;
    contributing_factors.push('Error severity level indicates potential business impact');
    preventive_actions.push('Prioritize resolution to prevent further escalation');
  }

  // Rule 6: Recent deployments (+10 points)
  const rawLog = input.incident.raw_log as any;
  if (rawLog?.recent_deploys?.length > 0) {
    score += 10;
    contributing_factors.push(`Recent deployment detected: ${rawLog.recent_deploys[0]}`);
    preventive_actions.push('Review recent changes for potential regression');
  }

  // Normalize to 0-1 range (max possible score is 120)
  const normalizedScore = Math.min(score / 100, 1);

  // Determine risk level
  let risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  if (normalizedScore >= 0.7) {
    risk_level = 'HIGH';
  } else if (normalizedScore >= 0.4) {
    risk_level = 'MEDIUM';
  } else {
    risk_level = 'LOW';
  }

  const result: RiskAssessment = {
    risk_score: Math.round(normalizedScore * 100) / 100,
    risk_level,
    contributing_factors,
    preventive_actions,
    requires_escalation: normalizedScore >= 0.8
  };

  // Log to audit
  insertAuditRecord({
    audit_id: auditId,
    tool_name: 'predict_risk',
    input_hash: inputHash,
    output_summary: `Risk: ${risk_level} (${result.risk_score})`,
    full_output: JSON.stringify(result)
  });

  return {
    tool: 'predict_risk',
    audit_id: auditId,
    result
  };
}
