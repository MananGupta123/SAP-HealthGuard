// Find Similar Incidents Tool - TF-IDF based similarity search
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getIncidentById, insertAuditRecord } from '../db/schema';
import { findSimilarIncidents as searchSimilar } from '../services/similarity';
import { Incident, SimilarIncident, ToolResult } from '../types';

interface FindSimilarInput {
  incident: Incident;
  top_k?: number;
}

/**
 * Find similar incidents using TF-IDF similarity search
 */
export function findSimilarIncidents(input: FindSimilarInput): ToolResult<SimilarIncident[]> {
  const auditId = uuidv4();
  const inputHash = crypto.createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')
    .substring(0, 16);

  const topK = input.top_k || 5;
  
  // Build search text from incident
  const searchText = `${input.incident.title} ${input.incident.description} ${input.incident.module}`;
  
  // Search for similar incidents
  const similarities = searchSimilar(searchText, topK, input.incident.incident_id);
  
  // Enrich with incident details
  const results: SimilarIncident[] = similarities.map(sim => {
    const incident = getIncidentById(sim.incident_id);
    return {
      incident_id: sim.incident_id,
      similarity_score: sim.similarity_score,
      title: incident?.title || 'Unknown',
      resolution: incident?.status === 'resolved' ? 'Resolved via standard procedure' : 'Pending resolution'
    };
  });

  // Log to audit
  insertAuditRecord({
    audit_id: auditId,
    tool_name: 'find_similar_incidents',
    input_hash: inputHash,
    output_summary: `Found ${results.length} similar incidents`,
    full_output: JSON.stringify(results)
  });

  return {
    tool: 'find_similar_incidents',
    audit_id: auditId,
    result: results
  };
}
