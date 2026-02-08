// Main Express Server
import cors from 'cors';
import express from 'express';
import { initializeDatabase } from './db/schema';
import { initializeTfIdf } from './services/similarity';

// Import routes
import escalateRoutes from './routes/escalate';
import incidentRoutes from './routes/incidents';
import sandboxRoutes from './routes/sandbox';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SAP HealthGuard Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/sap/sandbox', sandboxRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/escalate', escalateRoutes);
app.use('/api/escalations', escalateRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize and start (async for sql.js)
async function start() {
  try {
    // Initialize database (async for sql.js)
    await initializeDatabase();
    
    // Initialize TF-IDF index
    initializeTfIdf();
    
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🏥 SAP HealthGuard Backend                          ║
║                                                        ║
║   Server running on http://localhost:${PORT}             ║
║                                                        ║
║   Endpoints:                                           ║
║   • GET  /health              - Health check           ║
║   • GET  /sap/sandbox/logs    - Get SAP logs           ║
║   • POST /sap/sandbox/logs    - Create SAP log         ║
║   • POST /api/incidents/ingest - Ingest logs           ║
║   • POST /api/incidents/analyze - Full analysis        ║
║   • GET  /api/incidents       - List incidents         ║
║   • POST /api/escalate        - Create escalation      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
