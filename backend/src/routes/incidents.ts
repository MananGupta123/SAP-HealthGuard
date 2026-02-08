// Incident Routes - Main API endpoints for incident management
import { Request, Response, Router } from 'express';
import { getAllLogs } from '../data/seed-logs';
import { getAllIncidents, getIncidentById, insertIncident } from '../db/schema';
import { addDocumentToIndex } from '../services/similarity';
import { analyzeIncident } from '../tools/analyze-incident';
import { escalateToHuman } from '../tools/escalate-to-human';
import { findSimilarIncidents } from '../tools/find-similar-incidents';
import { predictRisk } from '../tools/predict-risk';
import { suggestPlaybook } from '../tools/suggest-playbook';
import { Incident, OutputSchema, SystemMetrics } from '../types';
import { generateSearchableText, normalizeLogToIncident } from '../utils/normalize';

const router = Router();

/**
 * POST /api/incidents/ingest
 * Ingest logs from SAP sandbox and create incidents
 */
router.post('/ingest', async (req: Request, res: Response) => {
  try {
    // Get logs from sandbox
    const logs = getAllLogs();
    const ingested: string[] = [];
    
    for (const log of logs) {
      // Normalize log to incident format
      const incident = normalizeLogToIncident(log);
      
      // Insert into database
      insertIncident({
        incident_id: incident.incident_id,
        raw_log: JSON.stringify(log),
        title: incident.title,
        description: incident.description,
        module: incident.module,
        severity: incident.severity,
        timestamp: incident.timestamp,
        month_end: incident.month_end
      });
      
      // Add to TF-IDF index
      const searchText = generateSearchableText(incident);
      addDocumentToIndex(incident.incident_id, searchText);
      
      ingested.push(incident.incident_id);
    }
    
    res.json({
      message: `Ingested ${ingested.length} incidents`,
      incident_ids: ingested
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: 'Failed to ingest logs: ' + (error as Error).message });
  }
});

/**
 * GET /api/incidents
 * List all incidents
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { limit, module, severity } = req.query;
    let incidents = getAllIncidents(limit ? parseInt(limit as string) : 50);
    
    // Filter by module
    if (module && typeof module === 'string') {
      incidents = incidents.filter((i: any) => i.module === module.toUpperCase());
    }
    
    // Filter by severity
    if (severity && typeof severity === 'string') {
      incidents = incidents.filter((i: any) => i.severity === severity.toUpperCase());
    }
    
    res.json({
      count: incidents.length,
      incidents: incidents.map((i: any) => ({
        incident_id: i.incident_id,
        title: i.title,
        description: i.description,
        module: i.module,
        severity: i.severity,
        timestamp: i.timestamp,
        month_end: i.month_end === 1,
        status: i.status
      }))
    });
  } catch (error) {
    console.error('List incidents error:', error);
    res.status(500).json({ error: 'Failed to list incidents' });
  }
});

/**
 * GET /api/incidents/:id
 * Get a specific incident
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const incident = getIncidentById(id);
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json({
      ...incident,
      month_end: incident.month_end === 1,
      raw_log: JSON.parse(incident.raw_log)
    });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Failed to get incident' });
  }
});

/**
 * POST /api/incidents/analyze
 * Full analysis pipeline - returns OutputSchema
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { incident_id, system_metrics } = req.body;
    
    if (!incident_id) {
      return res.status(400).json({ error: 'incident_id is required' });
    }
    
    // Get incident from database
    const dbIncident = getIncidentById(incident_id);
    if (!dbIncident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    // Convert to Incident type
    const incident: Incident = {
      incident_id: dbIncident.incident_id,
      title: dbIncident.title,
      description: dbIncident.description,
      module: dbIncident.module,
      severity: dbIncident.severity as 'ERROR' | 'WARNING' | 'INFO',
      timestamp: dbIncident.timestamp,
      month_end: dbIncident.month_end === 1,
      raw_log: JSON.parse(dbIncident.raw_log)
    };
    
    // Default system metrics if not provided
    const metrics: SystemMetrics = system_metrics || {
      cpu_percent: Math.random() * 100,
      memory_percent: Math.random() * 100,
      db_latency_ms: Math.random() * 300,
      active_users: Math.floor(Math.random() * 500)
    };
    
    // Run analysis pipeline
    const analysisResult = await analyzeIncident({ incident });
    const similarResult = findSimilarIncidents({ incident, top_k: 5 });
    const riskResult = predictRisk({ 
      incident, 
      system_metrics: metrics,
      similar_count: similarResult.result.length
    });
    const playbookResult = await suggestPlaybook({
      incident,
      classification: analysisResult.result.classification,
      similar_incidents: similarResult.result
    });
    
    // Build output schema
    const output: OutputSchema = {
      incident_id: incident.incident_id,
      agent_version: '1.0.0',
      
      analysis: analysisResult.result,
      
      similar_incidents: similarResult.result,
      
      risk: riskResult.result,
      
      playbook: playbookResult.result,
      
      decision: riskResult.result.requires_escalation 
        ? 'ESCALATE_TO_HUMAN' 
        : playbookResult.result.steps.some(s => s.escalate_required)
          ? 'ESCALATE_TO_HUMAN'
          : 'PROCEED_WITH_PLAYBOOK',
      
      escalation: riskResult.result.requires_escalation || playbookResult.result.steps.some(s => s.escalate_required)
        ? (() => {
            const escResult = escalateToHuman({
              incident_id: incident.incident_id,
              reason: riskResult.result.requires_escalation 
                ? `High risk score (${riskResult.result.risk_score}) requires human review`
                : 'Playbook contains steps requiring elevated permissions',
              required_role: 'SAP_ADMIN',
              requester: 'agent',
              context_snapshot: {
                classification: analysisResult.result.classification,
                risk_score: riskResult.result.risk_score,
                contributing_factors: riskResult.result.contributing_factors
              }
            });
            return {
              escalation_id: escResult.result.escalation_id,
              reason: riskResult.result.requires_escalation 
                ? `High risk score (${riskResult.result.risk_score}) requires human review`
                : 'Playbook contains steps requiring elevated permissions',
              required_role: 'SAP_ADMIN'
            };
          })()
        : undefined,
      
      audit_trail: {
        tool_calls: [
          { tool: 'analyze_incident', audit_id: analysisResult.audit_id },
          { tool: 'find_similar_incidents', audit_id: similarResult.audit_id },
          { tool: 'predict_risk', audit_id: riskResult.audit_id },
          { tool: 'suggest_playbook', audit_id: playbookResult.audit_id }
        ],
        prompt_hashes: {
          analysis: analysisResult.result.prompt_hash,
          playbook: playbookResult.result.prompt_hash
        }
      }
    };
    
    res.json(output);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + (error as Error).message });
  }
});

export default router;
