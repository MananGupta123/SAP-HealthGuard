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
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'WARNING'>('ALL');
  const [lastUpdate, setLastUpdate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/incidents?limit=100');
        const data = await res.json();
        const incidentList = data.incidents || data || [];
        if (Array.isArray(incidentList)) {
          setIncidents(incidentList);
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  // Calculate Stats
  const criticalCount = incidents.filter(i => i.severity === 'ERROR').length;
  const warningCount = incidents.filter(i => i.severity === 'WARNING').length;
  const systemHealth = Math.max(0, 100 - (criticalCount * 5) - (warningCount * 2));

  const filteredIncidents = incidents.filter(i => {
    if (filter === 'ALL') return true;
    return i.severity === filter;
  });

  return (
    <div className="min-h-screen bg-hg-bg relative grid-overlay">
      {/* Radiant Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-hg-amber/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 bg-hg-amber rounded-full animate-pulse" />
               <h1 className="text-xs font-mono text-hg-amber tracking-widest uppercase">Live Monitoring</h1>
            </div>
            <h2 className="text-3xl font-bold text-hg-text tracking-tight">Incident Command</h2>
          </div>

          {/* Stats Grid */}
          <div className="flex gap-4">
             <div className="glass-panel px-6 py-3 rounded-lg min-w-[140px]">
                <div className="text-xs text-hg-text-dim font-mono uppercase mb-1">System Health</div>
                <div className={`text-2xl font-bold ${systemHealth > 80 ? 'text-hg-green' : 'text-hg-red'}`}>
                  {systemHealth}%
                </div>
             </div>
             <div className="glass-panel px-6 py-3 rounded-lg min-w-[140px]">
                <div className="text-xs text-hg-text-dim font-mono uppercase mb-1">Critical Alerts</div>
                <div className="text-2xl font-bold text-hg-text">
                  {criticalCount}
                </div>
             </div>
          </div>
        </div>

        {/* Filters / Toolbar */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-hg-border/50">
           <div className="flex gap-4 text-sm font-mono text-hg-text-dim">
              <button 
                onClick={() => setFilter('ALL')}
                className={`transition-colors hover:text-hg-text ${filter === 'ALL' ? 'text-hg-text font-bold' : ''}`}
              >
                ALL [{incidents.length}]
              </button>
              <button 
                onClick={() => setFilter('ERROR')}
                className={`transition-colors hover:text-hg-red ${filter === 'ERROR' ? 'text-hg-red font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}`}
              >
                ERROR [{criticalCount}]
              </button>
              <button 
                onClick={() => setFilter('WARNING')}
                className={`transition-colors hover:text-hg-amber ${filter === 'WARNING' ? 'text-hg-amber font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]' : ''}`}
              >
                WARNING [{warningCount}]
              </button>
           </div>
           <div className="text-xs text-hg-text-dim font-mono">
              LAST UPDATE: {lastUpdate}
           </div>
        </div>
      
        {/* Incident List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-20 text-hg-text-dim font-mono animate-pulse">
              INITIALIZING DATA STREAM...
            </div>
          ) : (
            <>
              {filteredIncidents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((incident, idx) => (
                <Link
                  key={incident.incident_id}
                  href={`/incidents/${incident.incident_id}`}
                  className="group block"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="glass-panel rounded-md p-4 flex items-center gap-6 transition-all duration-300 hover:translate-x-1 hover:border-hg-amber/50">
                    
                    {/* Severity Indicator */}
                    <div className={`w-1 h-12 rounded-full ${
                      incident.severity === 'ERROR' ? 'bg-hg-red shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                      incident.severity === 'WARNING' ? 'bg-hg-amber shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                      'bg-blue-500'
                    }`} />

                    {/* ID & Time */}
                    <div className="flex flex-col min-w-[140px]">
                       <span className="text-xs font-mono text-hg-text-dim mb-1 group-hover:text-hg-amber transition-colors">
                         {incident.incident_id}
                       </span>
                       <span className="text-xs font-mono text-hg-text-dim/50">
                         {new Date(incident.timestamp).toLocaleTimeString()}
                       </span>
                    </div>

                    {/* Module Badge */}
                    <div className="min-w-[80px]">
                      <span className="text-xs font-bold font-mono text-hg-text bg-white/5 px-2 py-1 rounded border border-white/5">
                        {incident.module}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                       <h3 className="text-sm font-medium text-hg-text group-hover:text-white transition-colors truncate">
                         {incident.title}
                       </h3>
                       <div className="flex gap-2 mt-1">
                          {incident.month_end && (
                            <span className="text-[10px] font-mono text-hg-amber bg-hg-amber/10 px-1.5 rounded">
                              MONTH-END
                            </span>
                          )}
                       </div>
                    </div>

                    {/* Arrow */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-hg-amber font-mono">
                      OPEN_CASE &rarr;
                    </div>

                  </div>
                </Link>
              ))}
              
              {/* Pagination Controls */}
              {filteredIncidents.length > 0 && (
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                   <span className="text-xs text-hg-text-dim font-mono">
                     Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredIncidents.length)} of {filteredIncidents.length}
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
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={currentPage * ITEMS_PER_PAGE >= filteredIncidents.length}
                        className="px-3 py-1 text-xs font-mono bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-hg-text transition-colors"
                      >
                        NEXT
                      </button>
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
