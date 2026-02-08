// Escalate to Human Tool - Creates escalation records for human review
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { insertAuditRecord, insertEscalation } from '../db/schema';
import { ToolResult } from '../types';

interface EscalationInput {
  incident_id: string;
  reason: string;
  required_role: string;
  requester?: string;
  context_snapshot: Record<string, any>;
}

interface EscalationResult {
  ack: boolean;
  escalation_id: string;
}

/**
 * Create an escalation record for human review
 */
export function escalateToHuman(input: EscalationInput): ToolResult<EscalationResult> {
  const auditId = `escalate_${uuidv4().substring(0, 8)}`;
  const escalationId = `ESC-${uuidv4().substring(0, 8).toUpperCase()}`;
  const startTime = Date.now();
  
  try {
    // Insert escalation record
    insertEscalation({
      escalation_id: escalationId,
      incident_id: input.incident_id,
      reason: input.reason,
      required_role: input.required_role,
      requester: input.requester || 'agent',
      snapshot: JSON.stringify(input.context_snapshot),
      timestamp: new Date().toISOString()
    });
    
    // Record audit
    const inputHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(input))
      .digest('hex')
      .substring(0, 16);
    
    insertAuditRecord({
      audit_id: auditId,
      tool_name: 'escalate_to_human',
      input_hash: inputHash,
      output_summary: `Escalation ${escalationId} created for ${input.required_role}`,
      full_output: JSON.stringify({ escalation_id: escalationId, reason: input.reason })
    });
    
    console.log(`✅ escalate_to_human completed in ${Date.now() - startTime}ms: ${escalationId}`);
    
    return {
      tool: 'escalate_to_human',
      result: {
        ack: true,
        escalation_id: escalationId
      },
      audit_id: auditId
    };
  } catch (error) {
    console.error('Escalation failed:', error);
    
    insertAuditRecord({
      audit_id: auditId,
      tool_name: 'escalate_to_human',
      input_hash: 'error',
      output_summary: 'Escalation failed: ' + (error as Error).message
    });
    
    return {
      tool: 'escalate_to_human',
      result: {
        ack: false,
        escalation_id: ''
      },
      audit_id: auditId
    };
  }
}
