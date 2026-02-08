// Suggest Playbook Tool - LLM-generated remediation playbook
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { insertAuditRecord } from '../db/schema';
import { generatePlaybookWithLLM } from '../services/groq';
import { Incident, Playbook, SimilarIncident, ToolResult } from '../types';

interface SuggestPlaybookInput {
  incident: Incident;
  classification: string;
  similar_incidents: SimilarIncident[];
}

/**
 * Generate a remediation playbook using LLM
 */
export async function suggestPlaybook(input: SuggestPlaybookInput): Promise<ToolResult<Playbook>> {
  const auditId = uuidv4();
  const inputHash = crypto.createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
    .substring(0, 16);

  try {
    const llmResult = await generatePlaybookWithLLM({
      incident_summary: `${input.incident.title}: ${input.incident.description}`,
      classification: input.classification,
      module: input.incident.module,
      similar_incidents: input.similar_incidents.map(s => ({
        incident_id: s.incident_id,
        resolution: s.resolution || 'Standard resolution procedure'
      }))
    });

    const result: Playbook = {
      title: llmResult.title,
      steps: llmResult.steps,
      required_permissions: llmResult.required_permissions,
      estimated_time_minutes: llmResult.estimated_time_minutes,
      confidence: llmResult.confidence,
      prompt_hash: llmResult.prompt_hash
    };

    insertAuditRecord({
      audit_id: auditId,
      tool_name: 'suggest_playbook',
      input_hash: inputHash,
      output_summary: `Generated ${result.steps.length} step playbook`,
      full_output: JSON.stringify(result)
    });

    return {
      tool: 'suggest_playbook',
      audit_id: auditId,
      result
    };
  } catch (error) {
    console.error('Suggest playbook error:', error);

    // Fallback playbook
    const fallbackResult: Playbook = {
      title: `Investigate ${input.incident.module} ${input.incident.severity}`,
      steps: [
        {
          step_id: '1',
          action: 'Review system logs',
          command_or_API: `Transaction SM21 or SE16 for table ${input.incident.module === 'FI' ? 'BKPF' : 'relevant table'}`,
          expected_result: 'Identify error patterns and timestamps',
          verification: 'Log entries match incident timeline',
          rollback: 'N/A - read only operation'
        },
        {
          step_id: '2',
          action: 'Check for locks and blocking processes',
          command_or_API: 'Transaction SM12 or DB02',
          expected_result: 'No blocking locks found',
          verification: 'System resources available',
          rollback: 'Release locks if necessary'
        },
        {
          step_id: '3',
          action: 'Review recent transports',
          command_or_API: 'Transaction STMS',
          expected_result: 'No problematic transports identified',
          verification: 'Transport logs clean',
          rollback: 'Import rollback transport if needed',
          escalate_required: true
        }
      ],
      required_permissions: ['SAP_ALL', 'S_ADMI_FCD'],
      estimated_time_minutes: 30,
      confidence: 0.5,
      prompt_hash: 'fallback_no_llm'
    };

    insertAuditRecord({
      audit_id: auditId,
      tool_name: 'suggest_playbook',
      input_hash: inputHash,
      output_summary: 'FALLBACK: Generated default playbook',
      full_output: JSON.stringify(fallbackResult)
    });

    return {
      tool: 'suggest_playbook',
      audit_id: auditId,
      result: fallbackResult
    };
  }
}
