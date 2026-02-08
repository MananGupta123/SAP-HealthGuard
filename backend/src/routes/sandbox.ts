// SAP Sandbox Routes - Simulated SAP API endpoints
import { Request, Response, Router } from 'express';
import { addLog, getAllLogs, SapLog } from '../data/seed-logs';

const router = Router();

/**
 * GET /sap/sandbox/logs
 * Retrieve all SAP logs (simulates SAP Solution Manager API)
 */
router.get('/logs', (req: Request, res: Response) => {
  try {
    const { module, severity, limit } = req.query;
    
    let logs = getAllLogs();
    
    // Filter by module if specified
    if (module && typeof module === 'string') {
      logs = logs.filter(log => log.module === module.toUpperCase());
    }
    
    // Filter by severity if specified
    if (severity && typeof severity === 'string') {
      logs = logs.filter(log => log.severity === severity.toUpperCase());
    }
    
    // Limit results
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    logs = logs.slice(0, limitNum);
    
    res.json({
      count: logs.length,
      logs: logs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * POST /sap/sandbox/logs
 * Create a new SAP log entry (simulates SAP logging)
 */
router.post('/logs', (req: Request, res: Response) => {
  try {
    const newLog: Partial<SapLog> = req.body;
    
    // Validate required fields
    if (!newLog.module || !newLog.message || !newLog.severity) {
      return res.status(400).json({ 
        error: 'Missing required fields: module, message, severity' 
      });
    }
    
    const log = addLog(newLog as any);
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
});

/**
 * GET /sap/sandbox/logs/:id
 * Get a specific log by ID
 */
router.get('/logs/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const logs = getAllLogs();
    const log = logs.find(l => l.logId === id);
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.json(log);
  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({ error: 'Failed to fetch log' });
  }
});

/**
 * GET /sap/sandbox/modules
 * List available SAP modules
 */
router.get('/modules', (req: Request, res: Response) => {
  res.json({
    modules: [
      { code: 'FI', name: 'Financial Accounting' },
      { code: 'CO', name: 'Controlling' },
      { code: 'MM', name: 'Materials Management' },
      { code: 'SD', name: 'Sales and Distribution' },
      { code: 'PP', name: 'Production Planning' },
      { code: 'HR', name: 'Human Resources' },
      { code: 'BASIS', name: 'Basis/System Administration' }
    ]
  });
});

export default router;
