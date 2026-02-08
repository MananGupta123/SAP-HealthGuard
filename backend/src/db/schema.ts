// Database schema using sql.js (pure JS SQLite - no native compilation needed)
import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

const DB_PATH = process.env.DB_PATH || './data/healthguard.db';

let db: SqlJsDatabase | null = null;

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  ensureDataDir();
  
  const SQL = await initSqlJs();
  
  // Load existing database or create new
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('✅ Loaded existing database from', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('✅ Created new database');
  }
  
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS incidents (
      incident_id TEXT PRIMARY KEY,
      raw_log TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      module TEXT NOT NULL,
      severity TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      month_end INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      tfidf_vector TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS audit (
      audit_id TEXT PRIMARY KEY,
      tool_name TEXT NOT NULL,
      input_hash TEXT NOT NULL,
      output_summary TEXT,
      full_output TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS escalations (
      escalation_id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      required_role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      requester TEXT,
      snapshot TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  
  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_incidents_module ON incidents(module)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status)`);
  
  saveDatabase();
  console.log('✅ Database tables initialized');
}

// Get database instance
export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Insert incident
export function insertIncident(incident: {
  incident_id: string;
  raw_log: string;
  title: string;
  description: string;
  module: string;
  severity: string;
  timestamp: string;
  month_end: boolean;
}): void {
  const d = getDb();
  d.run(
    `INSERT OR REPLACE INTO incidents (incident_id, raw_log, title, description, module, severity, timestamp, month_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [incident.incident_id, incident.raw_log, incident.title, incident.description, 
     incident.module, incident.severity, incident.timestamp, incident.month_end ? 1 : 0]
  );
  saveDatabase();
}

// Get all incidents
export function getAllIncidents(limit: number = 50): any[] {
  const d = getDb();
  const stmt = d.prepare(`SELECT * FROM incidents ORDER BY created_at DESC LIMIT ?`);
  stmt.bind([limit]);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Get incident by ID
export function getIncidentById(incidentId: string): any | null {
  const d = getDb();
  const stmt = d.prepare(`SELECT * FROM incidents WHERE incident_id = ?`);
  stmt.bind([incidentId]);
  
  if (stmt.step()) {
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }
  stmt.free();
  return null;
}

// Insert audit record
export function insertAuditRecord(record: {
  audit_id: string;
  tool_name: string;
  input_hash: string;
  output_summary?: string;
  full_output?: string;
}): void {
  const d = getDb();
  d.run(
    `INSERT INTO audit (audit_id, tool_name, input_hash, output_summary, full_output)
     VALUES (?, ?, ?, ?, ?)`,
    [record.audit_id, record.tool_name, record.input_hash, 
     record.output_summary || null, record.full_output || null]
  );
  saveDatabase();
}

// Insert escalation
export function insertEscalation(escalation: {
  escalation_id: string;
  incident_id: string;
  reason: string;
  required_role: string;
  requester?: string;
  snapshot?: string;
  timestamp?: string;
}): void {
  const d = getDb();
  d.run(
    `INSERT INTO escalations (escalation_id, incident_id, reason, required_role, requester, snapshot, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [escalation.escalation_id, escalation.incident_id, escalation.reason,
     escalation.required_role, escalation.requester || null, escalation.snapshot || null,
     escalation.timestamp || new Date().toISOString()]
  );
  saveDatabase();
}

// Get pending escalations
export function getPendingEscalations(): any[] {
  const d = getDb();
  const stmt = d.prepare(`SELECT * FROM escalations WHERE status = 'pending' ORDER BY timestamp DESC`);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Get escalations by incident
export function getEscalationsByIncident(incidentId: string): any[] {
  const d = getDb();
  const stmt = d.prepare(`SELECT * FROM escalations WHERE incident_id = ? ORDER BY timestamp DESC`);
  stmt.bind([incidentId]);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Update incident TF-IDF vector
export function updateIncidentTfidfVector(incidentId: string, vector: string): void {
  const d = getDb();
  d.run(`UPDATE incidents SET tfidf_vector = ? WHERE incident_id = ?`, [vector, incidentId]);
  saveDatabase();
}

// Update escalation status
export function updateEscalationStatus(escalationId: string, status: string, requester?: string): boolean {
  const d = getDb();
  d.run(`UPDATE escalations SET status = ?, requester = COALESCE(?, requester) WHERE escalation_id = ?`,
    [status, requester || null, escalationId]);
  saveDatabase();
  return d.getRowsModified() > 0;
}

// Export db for direct access in routes
export { db };

