// Log normalization utility - Converts SAP logs to Incidents
import { v4 as uuidv4 } from 'uuid';
import { Incident, SapLog } from '../types';

/**
 * Extracts a concise title from the log message
 */
function extractTitle(message: string, module: string): string {
  // Get first meaningful part of message
  const colonIndex = message.indexOf(':');
  if (colonIndex > 0 && colonIndex < 50) {
    return message.substring(0, colonIndex).trim();
  }
  
  // Fallback: first 50 chars
  const truncated = message.length > 50 ? message.substring(0, 47) + '...' : message;
  return `${module}: ${truncated}`;
}

/**
 * Normalizes a raw SAP log into an Incident structure
 */
export function normalizeLogToIncident(log: SapLog): Incident {
  const title = extractTitle(log.message, log.module);
  
  return {
    incident_id: `INC-${uuidv4().substring(0, 8).toUpperCase()}`,
    raw_log: log,
    title,
    description: log.message,
    module: log.module,
    severity: log.severity,
    timestamp: log.timestamp,
    month_end: log.month_end,
    status: 'open',
    created_at: new Date().toISOString()
  };
}

/**
 * Batch normalize multiple logs
 */
export function normalizeLogsToIncidents(logs: SapLog[]): Incident[] {
  return logs.map(normalizeLogToIncident);
}

/**
 * Generate a searchable text representation for TF-IDF
 */
export function generateSearchableText(incident: Incident): string {
  const rawLog = incident.raw_log as SapLog;
  const parts = [
    incident.title,
    incident.description,
    `module:${incident.module}`,
    `severity:${incident.severity}`,
    incident.month_end ? 'month-end closing period' : '',
    rawLog?.changed_objects?.join(' ') || '',
    rawLog?.recent_deploys?.join(' ') || ''
  ];
  
  return parts.filter(Boolean).join(' ').toLowerCase();
}
