// Seed logs for SAP Sandbox - Realistic SAP-shaped events
import { v4 as uuidv4 } from 'uuid';
import { SapLog } from '../types';

// Re-export for use in routes
export { SapLog } from '../types';

// Generate timestamps relative to current time (called at request time)
const getTimestamp = (daysAgo: number, hoursAgo: number = 0): string => {
  const now = new Date(); // Always use current time
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

export const seedLogs: SapLog[] = [
  // Month-end cluster - Financial module stress
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-01',
    application: 'S/4HANA',
    module: 'FI',
    severity: 'ERROR',
    message: 'BAPI_ACC_DOCUMENT_POST failed: Lock timeout on table BSEG during month-end closing batch',
    timestamp: getTimestamp(0, 2),
    month_end: true,
    changed_objects: ['BSEG', 'BKPF', 'GLT0'],
    recent_deploys: ['FI-GL-2024.01.15', 'BASIS-PATCH-001']
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-01',
    application: 'S/4HANA',
    module: 'FI',
    severity: 'ERROR',
    message: 'Transaction FB50: Posting period 01/2026 is not open for company code 1000',
    timestamp: getTimestamp(0, 1),
    month_end: true,
    changed_objects: ['T001B', 'BKPF'],
    recent_deploys: []
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-01',
    application: 'S/4HANA',
    module: 'FI',
    severity: 'WARNING',
    message: 'High database load detected during FI-GL reconciliation: Response time > 5s',
    timestamp: getTimestamp(0, 3),
    month_end: true,
    changed_objects: ['FAGLFLEXA', 'ACDOCA'],
    recent_deploys: ['FI-GL-2024.01.15']
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-02',
    application: 'S/4HANA',
    module: 'CO',
    severity: 'ERROR',
    message: 'Cost center allocation cycle KSUB failed: Sender/receiver imbalance detected',
    timestamp: getTimestamp(0, 4),
    month_end: true,
    changed_objects: ['COSS', 'COSP', 'COKA'],
    recent_deploys: []
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-01',
    application: 'S/4HANA',
    module: 'FI',
    severity: 'ERROR',
    message: 'Asset depreciation run AFAB terminated: Missing useful life for asset 1000-00001234',
    timestamp: getTimestamp(0, 5),
    month_end: true,
    changed_objects: ['ANLC', 'ANLP', 'ANEK'],
    recent_deploys: ['FI-AA-2024.01.10']
  },

  // Repeated failures pattern - MM module
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-02',
    application: 'S/4HANA',
    module: 'MM',
    severity: 'ERROR',
    message: 'MIGO goods receipt 4900012345: Movement type 101 not allowed for material type HAWA',
    timestamp: getTimestamp(1, 2),
    month_end: false,
    changed_objects: ['MSEG', 'MKPF', 'MARD'],
    recent_deploys: ['MM-IM-2024.01.08']
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-02',
    application: 'S/4HANA',
    module: 'MM',
    severity: 'ERROR',
    message: 'MIGO goods receipt 4900012346: Movement type 101 not allowed for material type HAWA',
    timestamp: getTimestamp(1, 1),
    month_end: false,
    changed_objects: ['MSEG', 'MKPF', 'MARD'],
    recent_deploys: ['MM-IM-2024.01.08']
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-02',
    application: 'S/4HANA',
    module: 'MM',
    severity: 'ERROR',
    message: 'MIGO goods receipt 4900012347: Movement type 101 not allowed for material type HAWA',
    timestamp: getTimestamp(1, 0),
    month_end: false,
    changed_objects: ['MSEG', 'MKPF', 'MARD'],
    recent_deploys: ['MM-IM-2024.01.08']
  },

  // SD module issues
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-03',
    application: 'S/4HANA',
    module: 'SD',
    severity: 'ERROR',
    message: 'Sales order 0010012345: Pricing procedure RVAA01 not found for sales org 1000',
    timestamp: getTimestamp(2, 5),
    month_end: false,
    changed_objects: ['VBAK', 'VBAP', 'KONV'],
    recent_deploys: ['SD-PRICING-2024.01.12']
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-03',
    application: 'S/4HANA',
    module: 'SD',
    severity: 'WARNING',
    message: 'ATP check timeout for material MAT-001: BW extraction running in parallel',
    timestamp: getTimestamp(2, 3),
    month_end: false,
    changed_objects: ['MARD', 'RESB'],
    recent_deploys: []
  },

  // PP module
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-01',
    application: 'S/4HANA',
    module: 'PP',
    severity: 'ERROR',
    message: 'Production order 1000012345 confirmation failed: Operation 0010 already confirmed',
    timestamp: getTimestamp(3, 2),
    month_end: false,
    changed_objects: ['AFKO', 'AFPO', 'AFRU'],
    recent_deploys: []
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-01',
    application: 'S/4HANA',
    module: 'PP',
    severity: 'WARNING',
    message: 'MRP run NEUPL: 15000 exception messages generated for plant 1000',
    timestamp: getTimestamp(3, 8),
    month_end: false,
    changed_objects: ['PLAF', 'MDKP', 'MDTB'],
    recent_deploys: ['PP-MRP-2024.01.05']
  },

  // HR/HCM module
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-HCM-01',
    application: 'SAP HCM',
    module: 'HR',
    severity: 'ERROR',
    message: 'Payroll run for area 01: Tax calculation error for employee 00001234',
    timestamp: getTimestamp(4, 1),
    month_end: true,
    changed_objects: ['PA0001', 'PA0008', 'RGDIR'],
    recent_deploys: ['HR-PY-2024.01.01']
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-HCM-01',
    application: 'SAP HCM',
    module: 'HR',
    severity: 'WARNING',
    message: 'Time evaluation RPTIME00: 250 employees with missing clock-in records',
    timestamp: getTimestamp(4, 6),
    month_end: false,
    changed_objects: ['PA2001', 'PA2002', 'TEVEN'],
    recent_deploys: []
  },

  // Basis/Technical
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-01',
    application: 'S/4HANA',
    module: 'BASIS',
    severity: 'WARNING',
    message: 'Background job RSUSR003 exceeded runtime threshold: 45 minutes',
    timestamp: getTimestamp(5, 2),
    month_end: false,
    changed_objects: [],
    recent_deploys: ['BASIS-SECURITY-2024.01.03']
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PROD-01',
    application: 'S/4HANA',
    module: 'BASIS',
    severity: 'INFO',
    message: 'Transport DEVK900123 imported successfully to production',
    timestamp: getTimestamp(5, 4),
    month_end: false,
    changed_objects: ['E070', 'E071'],
    recent_deploys: ['CUSTOM-DEV-001']
  },

  // Integration/Interface errors
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-PI-01',
    application: 'SAP PI/PO',
    module: 'XI',
    severity: 'ERROR',
    message: 'IDOC ORDERS05 to external system: Connection timeout after 30s',
    timestamp: getTimestamp(1, 8),
    month_end: false,
    changed_objects: ['EDIDC', 'EDIDS'],
    recent_deploys: []
  },
  {
    logId: uuidv4(),
    sourceSystem: 'SAP-BTP-01',
    application: 'SAP BTP',
    module: 'CPI',
    severity: 'ERROR',
    message: 'iFlow SalesOrder_Replication: OAuth token refresh failed for destination S4HANA_PROD',
    timestamp: getTimestamp(2, 1),
    month_end: false,
    changed_objects: [],
    recent_deploys: ['CPI-FLOW-2024.01.14']
  }
];

// Define log templates without timestamps (timestamps generated on request)
type LogTemplate = Omit<SapLog, 'logId' | 'timestamp'> & { daysAgo: number; hoursAgo: number };

const logTemplates: LogTemplate[] = seedLogs.map((log, index) => ({
  ...log,
  daysAgo: Math.floor(index / 6), // Spread logs over days
  hoursAgo: index % 6 // Spread logs over hours within each day
}));

// Mutable copy for runtime additions
let addedLogs: SapLog[] = [];

export const addLog = (log: Omit<SapLog, 'logId' | 'timestamp'>): SapLog => {
  const newLog: SapLog = {
    ...log,
    logId: uuidv4(),
    timestamp: new Date().toISOString()
  };
  addedLogs.push(newLog);
  return newLog;
};

// Generate fresh logs with current timestamps each time
export const getAllLogs = (): SapLog[] => {
  const now = new Date();
  
  const freshSeedLogs = logTemplates.map((template, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - template.daysAgo);
    date.setHours(date.getHours() - template.hoursAgo);
    
    const { daysAgo, hoursAgo, ...logData } = template;
    return {
      ...logData,
      logId: `LOG-${index.toString().padStart(3, '0')}`, // Stable IDs for seed logs
      timestamp: date.toISOString()
    } as SapLog;
  });
  
  return [...freshSeedLogs, ...addedLogs];
};

export const resetLogs = (): void => {
  addedLogs = [];
};
