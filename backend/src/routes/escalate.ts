// Escalation Routes - API endpoints for escalation management
import { Request, Response, Router } from 'express';
import { getEscalationsByIncident, getPendingEscalations, updateEscalationStatus } from '../db/schema';
import { escalateToHuman } from '../tools/escalate-to-human';

const router = Router();

/**
 * POST /api/escalate
 * Create a new escalation
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { incident_id, reason, required_role, requester } = req.body;
    
    if (!incident_id || !reason || !required_role) {
      return res.status(400).json({ 
        error: 'Missing required fields: incident_id, reason, required_role' 
      });
    }
    
    const result = escalateToHuman({
      incident_id,
      reason,
      required_role,
      requester: requester || 'api_user',
      context_snapshot: { source: 'api_request' }
    });
    
    res.json({
      ack: result.result.ack,
      escalation_id: result.result.escalation_id,
      audit_id: result.audit_id
    });
  } catch (error) {
    console.error('Escalation error:', error);
    res.status(500).json({ error: 'Escalation failed: ' + (error as Error).message });
  }
});

/**
 * GET /api/escalations
 * List all pending escalations
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const escalations = getPendingEscalations();
    
    const formatted = (escalations as any[]).map(e => ({
      ...e,
      snapshot: e.snapshot ? JSON.parse(e.snapshot) : {}
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('List escalations error:', error);
    res.status(500).json({ error: 'Failed to list escalations' });
  }
});

/**
 * GET /api/escalations/:incident_id
 * Get escalations for a specific incident
 */
router.get('/:incident_id', (req: Request, res: Response) => {
  try {
    const { incident_id } = req.params;
    const escalations = getEscalationsByIncident(incident_id);
    
    const formatted = (escalations as any[]).map(e => ({
      ...e,
      snapshot: e.snapshot ? JSON.parse(e.snapshot) : {}
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Get escalations error:', error);
    res.status(500).json({ error: 'Failed to get escalations' });
  }
});

/**
 * POST /api/escalations/:escalation_id/acknowledge
 * Acknowledge an escalation (simulates human response)
 */
router.post('/:escalation_id/acknowledge', (req: Request, res: Response) => {
  try {
    const { escalation_id } = req.params;
    const { acknowledged_by } = req.body;
    
    const success = updateEscalationStatus(escalation_id, 'acknowledged', acknowledged_by || 'admin');
    
    if (!success) {
      return res.status(404).json({ error: 'Escalation not found' });
    }
    
    res.json({
      escalation_id,
      status: 'acknowledged',
      acknowledged_by: acknowledged_by || 'admin',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Acknowledge error:', error);
    res.status(500).json({ error: 'Failed to acknowledge escalation' });
  }
});

export default router;
