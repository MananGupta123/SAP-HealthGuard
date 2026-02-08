'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Incident {
  incident_id: string;
  title: string;
  description: string;
  module: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  month_end: boolean;
  status: string;
  timestamp: string;
  created_at: string;
}

interface Stats {
  total: number;
  errors: number;
  warnings: number;
  monthEnd: number;
}

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, errors: 0, warnings: 0, monthEnd: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ module: '', severity: '', monthEnd: '' });
  const [ingesting, setIngesting] = useState(false);
  const [tickerTime, setTickerTime] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setTickerTime(new Date().toLocaleTimeString());
  }, []);

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.module) params.set('module', filters.module);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.monthEnd) params.set('month_end', filters.monthEnd);

      const res = await fetch(`/api/incidents?${params}`);
      const data = await res.json();
      
      const incidentList = data.incidents || data || [];
      if (Array.isArray(incidentList)) {
        setIncidents(incidentList);
        setStats({
          total: incidentList.length,
          errors: incidentList.filter((i: Incident) => i.severity === 'ERROR').length,
          warnings: incidentList.filter((i: Incident) => i.severity === 'WARNING').length,
          monthEnd: incidentList.filter((i: Incident) => i.month_end).length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await fetch('/api/incidents/ingest', { method: 'POST' });
      const data = await res.json();
      const count = data.incident_ids?.length || 0;
      alert(`Ingested ${count} incidents`);
      fetchIncidents();
    } catch (err) {
      console.error('Ingestion failed:', err);
    } finally {
      setIngesting(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [filters]);

  const healthScore = Math.max(0, 100 - (stats.errors * 10) - (stats.warnings * 3));

  return (
    <div className="min-h-screen bg-hg-bg relative grid-overlay">
      {/* Radiant Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-hg-amber/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-hg-green rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <h1 className="text-xs font-mono text-hg-green tracking-widest uppercase">System Operational</h1>
            </div>
            <h2 className="text-3xl font-bold text-hg-text">Mission Control</h2>
          </div>
          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 font-mono tracking-wide"
          >
            {ingesting ? 'INGESTING...' : '⟳ INGEST LOGS'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Health Score */}
          <div className="glass-panel p-5 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-4xl">♥</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-hg-text-dim font-mono uppercase tracking-wider">Health Score</span>
              <div className={`w-2 h-2 rounded-full ${healthScore >= 70 ? 'bg-hg-green shadow-[0_0_8px_rgba(34,197,94,0.6)]' : healthScore >= 40 ? 'bg-hg-amber' : 'bg-hg-red'}`}></div>
            </div>
            <div className="text-4xl font-bold font-mono text-hg-text mb-4">{healthScore}%</div>
            <div className="h-1 bg-white/5 overflow-hidden rounded-full">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${healthScore >= 70 ? 'bg-hg-green' : healthScore >= 40 ? 'bg-hg-amber' : 'bg-hg-red'}`}
                style={{ width: `${healthScore}%` }}
              ></div>
            </div>
          </div>


          {/* Total Incidents */}
          <div className="glass-panel p-5 rounded-lg hover:border-hg-amber/30 transition-colors relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs text-hg-text-dim font-mono uppercase tracking-wider">Total Active</span>
              <div className="text-4xl font-bold font-mono text-hg-text mt-2">{stats.total}</div>
              <div className="text-xs text-hg-text-dim mt-2 font-mono">INCIDENTS LOGGED</div>
            </div>
            {/* Sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none">
               <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
                 <path d="M0,10 L10,12 L20,8 L30,15 L40,5 L50,11 L60,9 L70,16 L80,14 L90,6 L100,10" 
                       fill="none" stroke="#f59e0b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                 <path d="M0,10 L10,12 L20,8 L30,15 L40,5 L50,11 L60,9 L70,16 L80,14 L90,6 L100,10 V20 H0 Z" 
                       fill="url(#gradient-amber)" className="opacity-50" />
                 <defs>
                   <linearGradient id="gradient-amber" x1="0" x2="0" y1="0" y2="1">
                     <stop offset="0%" stopColor="#f59e0b" />
                     <stop offset="100%" stopColor="transparent" />
                   </linearGradient>
                 </defs>
               </svg>
            </div>
          </div>

          {/* Errors */}
          <div className="glass-panel p-5 rounded-lg border-l-4 border-l-hg-red hover:bg-hg-red/5 transition-colors relative overflow-hidden">
            <div className="relative z-10">
               <span className="text-xs text-hg-text-dim font-mono uppercase tracking-wider">Critical Errors</span>
               <div className="text-4xl font-bold font-mono text-hg-red mt-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                 {stats.errors}
               </div>
               <div className="text-xs text-hg-red/70 mt-2 font-mono">REQUIRES ATTENTION</div>
            </div>
            {/* Error Pulse */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-hg-red/10 blur-xl rounded-full animate-pulse"></div>
          </div>

          {/* Month-End */}
          <div className="glass-panel p-5 rounded-lg border-l-4 border-l-hg-amber hover:bg-hg-amber/5 transition-colors relative">
            <span className="text-xs text-hg-text-dim font-mono uppercase tracking-wider">Month-End</span>
            <div className="text-4xl font-bold font-mono text-hg-amber mt-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              {stats.monthEnd}
            </div>
            <div className="text-xs text-hg-amber/70 mt-2 font-mono">HIGH RISK PERIOD</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel p-4 mb-6 rounded-lg flex flex-wrap items-center gap-4">
          <span className="text-xs text-hg-text-dim font-mono uppercase tracking-wider mr-2">Data Filters:</span>
          
          <select
            value={filters.module}
            onChange={(e) => setFilters(f => ({ ...f, module: e.target.value }))}
            className="bg-black/30 border border-hg-border text-xs text-hg-text font-mono px-3 py-1.5 rounded focus:border-hg-amber focus:outline-none hover:border-hg-amber/50 transition-colors"
          >
            <option value="">ALL MODULES</option>
            <option value="FI">FI - FINANCE</option>
            <option value="MM">MM - MATERIALS</option>
            <option value="SD">SD - SALES</option>
            <option value="PP">PP - PRODUCTION</option>
            <option value="HR">HR - HCM</option>
            <option value="BASIS">BASIS</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value }))}
            className="bg-black/30 border border-hg-border text-xs text-hg-text font-mono px-3 py-1.5 rounded focus:border-hg-amber focus:outline-none hover:border-hg-amber/50 transition-colors"
          >
            <option value="">ALL SEVERITIES</option>
            <option value="ERROR">ERROR</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>

          <select
            value={filters.monthEnd}
            onChange={(e) => setFilters(f => ({ ...f, monthEnd: e.target.value }))}
            className="bg-black/30 border border-hg-border text-xs text-hg-text font-mono px-3 py-1.5 rounded focus:border-hg-amber focus:outline-none hover:border-hg-amber/50 transition-colors"
          >
            <option value="">ALL PERIODS</option>
            <option value="true">MONTH-END ONLY</option>
            <option value="false">REGULAR OPS</option>
          </select>

          <button
            onClick={() => setFilters({ module: '', severity: '', monthEnd: '' })}
            className="text-xs text-hg-text-dim hover:text-hg-amber transition-colors ml-auto font-mono"
          >
            RESET FILTERS
          </button>
        </div>

        {/* Incidents Table */}
        <div className="glass-panel rounded-lg overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h2 className="text-sm font-bold text-hg-text font-mono tracking-wide">RECENT SIGNALS</h2>
            <div className="flex gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-hg-red"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-hg-amber"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-hg-green"></div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-hg-text-dim font-mono animate-pulse">ESTABLISHING DATALINK...</div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-hg-text-dim mb-4 font-mono">NO ACTIVE SIGNALS DETECTED</p>
              <button onClick={handleIngest} className="text-hg-amber hover:underline text-sm">Initiate Log Ingestion</button>
            </div>
          ) : (
            <>
            <div className="divide-y divide-white/5">
              {incidents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((incident, idx) => (
                <Link
                  key={incident.incident_id}
                  href={`/incidents/${incident.incident_id}`}
                  className="group block px-6 py-4 hover:bg-white/[0.02] transition-colors relative overflow-hidden"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-hg-amber transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                  
                  <div className="flex items-center gap-6">
                    {/* Severity Badge */}
                    <div className="min-w-[80px]">
                      <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded border ${
                        incident.severity === 'ERROR' ? 'bg-hg-red/10 text-hg-red border-hg-red/30' :
                        incident.severity === 'WARNING' ? 'bg-hg-amber/10 text-hg-amber border-hg-amber/30' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}>
                        {incident.severity}
                      </span>
                    </div>

                    {/* Module */}
                    <span className="text-xs font-mono text-hg-text-dim min-w-[60px]">{incident.module}</span>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-hg-text font-medium truncate group-hover:text-hg-amber transition-colors">
                        {incident.title}
                      </p>
                      <p className="text-xs text-hg-text-dim truncate mt-0.5 font-mono opacity-70">
                        {incident.description}
                      </p>
                    </div>

                    {/* Month-End Badge */}
                    {incident.month_end && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-hg-amber/10 text-hg-amber rounded hidden md:inline-block">
                        MONTH-END
                      </span>
                    )}

                    {/* Timestamp */}
                    <span className="text-xs text-hg-text-dim font-mono hidden md:inline-block">
                      {new Date(incident.timestamp).toLocaleTimeString()}
                    </span>

                    {/* Arrow */}
                    <span className="text-hg-text-dim group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
            {/* Pagination Controls */}
            <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
               <span className="text-xs text-hg-text-dim font-mono">
                 SHOWING {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, incidents.length)} OF {incidents.length}
               </span>
               <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-mono bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-hg-text transition-colors"
                  >
                    PREV
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(incidents.length / ITEMS_PER_PAGE), p + 1))}
                    disabled={currentPage * ITEMS_PER_PAGE >= incidents.length}
                    className="px-3 py-1 text-xs font-mono bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-hg-text transition-colors"
                  >
                    NEXT
                  </button>
               </div>
            </div>
            </>
          )}
        </div>

        {/* Ticker Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/5 py-1 z-50 overflow-hidden">
           <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] font-mono text-xs text-hg-text-dim flex gap-8">
              <span>SYSTEM: ONLINE</span>
              <span>NODE: SAP-SANDBOX-01 (ACTIVE)</span>
              <span>LATENCY: 24ms</span>
              <span>PROTECTION_LEVEL: HIGH</span>
              <span>AI_AGENT: STANDBY</span>
              <span>LAST_SCAN: {tickerTime}</span>
              <span>// SECURITY PROTOCOL: ENGAGED //</span>
           </div>
        </div>
      </div>
    </div>
  );
}
