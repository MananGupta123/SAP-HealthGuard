// Analyze Incident Tool - Uses Groq LLM for incident classification
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { insertAuditRecord } from '../db/schema';
import { analyzeWithLLM } from '../services/groq';
import { AnalysisResult, Incident, ToolResult } from '../types';

interface AnalyzeInput {
  incident: Incident;
}

/**
 * Analyze an incident using LLM to classify and identify root causes
 */
export async function analyzeIncident(input: AnalyzeInput): Promise<ToolResult<AnalysisResult>> {
  const auditId = uuidv4();
  const inputHash = crypto.createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
    .substring(0, 16);

  try {
    // Call LLM for analysis
    const llmResult = await analyzeWithLLM({
      title: input.incident.title,
      description: input.incident.description,
      module: input.incident.module,
      severity: input.incident.severity,
      month_end: input.incident.month_end,
      raw_log: input.incident.raw_log as any
    });

    const result: AnalysisResult = {
      classification: llmResult.classification,
      probable_root_causes: llmResult.probable_root_causes,
      relevant_logs_snippet: llmResult.relevant_logs_snippet,
      tags: llmResult.tags,
      prompt_hash: llmResult.prompt_hash
    };

    // Log to audit
    insertAuditRecord({
      audit_id: auditId,
      tool_name: 'analyze_incident',
      input_hash: inputHash,
      output_summary: result.classification,
      full_output: JSON.stringify(result)
    });

    return {
      tool: 'analyze_incident',
      audit_id: auditId,
      result
    };
  } catch (error) {
    console.error('Analyze incident error:', error);
    
    // Fallback to rule-based analysis
    const fallbackResult: AnalysisResult = {
      classification: `${input.incident.module} ${input.incident.severity}`,
      probable_root_causes: [
        input.incident.month_end ? 'Month-end processing load may be contributing to the issue' : 'System resource contention or configuration issue',
        (input.incident.raw_log as any)?.recent_deploys?.length > 0 
          ? `Recent deployment may have introduced changes: ${(input.incident.raw_log as any).recent_deploys[0]}`
          : 'No recent deployments detected'
      ],
      relevant_logs_snippet: [input.incident.description],
      tags: [input.incident.module, input.incident.severity.toLowerCase()],
      prompt_hash: 'fallback_no_llm'
    };

    insertAuditRecord({
      audit_id: auditId,
      tool_name: 'analyze_incident',
      input_hash: inputHash,
      output_summary: 'FALLBACK: ' + fallbackResult.classification,
      full_output: JSON.stringify(fallbackResult)
    });

    return {
      tool: 'analyze_incident',
      audit_id: auditId,
      result: fallbackResult
    };
  }
}
