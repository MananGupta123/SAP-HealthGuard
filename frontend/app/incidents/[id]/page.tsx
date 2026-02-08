'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PlaybookStep {
  step_id: string;
  action: string;
  command_or_API: string;
  expected_result: string;
  verification: string;
  rollback: string;
  escalate_required?: boolean;
}

interface AnalysisOutput {
  incident_id: string;
  agent_version: string;
  analysis: {
    classification: string;
    probable_root_causes: string[];
    relevant_logs_snippet: string[];
    tags: string[];
    prompt_hash: string;
  };
  similar_incidents: Array<{ incident_id: string; similarity_score: number; title?: string }>;
  risk: {
    risk_score: number;
    risk_level: string;
    contributing_factors: string[];
    preventive_actions: string[];
    requires_escalation: boolean;
  };
  playbook: {
    title: string;
    steps: PlaybookStep[];
    required_permissions: string[];
    estimated_time_minutes: number;
    confidence: number;
    prompt_hash: string;
  };
  decision: string;
  escalation?: {
    escalation_id: string;
    reason: string;
    required_role: string;
  };
  audit_trail: {
    tool_calls: Array<{ tool: string; audit_id: string }>;
    prompt_hashes: {
      analysis: string;
      playbook: string;
    };
  };
}

interface Incident {
  incident_id: string;
  title: string;
  description: string;
  module: string;
  severity: string;
  month_end: boolean;
  status: string;
  timestamp: string;
  raw_log: any;
}

export default function IncidentDetailPage() {
  const params = useParams();
  const incidentId = params.id as string;
  
  const [incident, setIncident] = useState<Incident | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await fetch(`/api/incidents/${incidentId}`);
        if (res.ok) {
          const data = await res.json();
          setIncident(data);
        }
      } catch (err) {
        console.error('Failed to fetch incident:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [incidentId]);

  const handleAnalyze = async () => {
    if (!incident) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/incidents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          system_metrics: {
            db_latency_ms: Math.floor(Math.random() * 300),
            cpu_percent: Math.floor(Math.random() * 100),
            memory_percent: 65,
            active_connections: 150,
          }
        })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      const res = await fetch('/api/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          reason: 'Manual escalation requested by operator',
          required_role: 'SAP_BASIS_ADMIN',
          requester: 'dashboard_user'
        })
      });
      const data = await res.json();
      alert(`Escalation created: ${data.escalation_id}`);
    } catch (err) {
      console.error('Escalation failed:', err);
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hg-bg grid-overlay flex items-center justify-center">
        <div className="text-hg-text-dim font-mono animate-pulse">ESTABLISHING SECURE CONNECTION...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-hg-bg grid-overlay flex items-center justify-center">
        <div className="text-center">
          <div className="text-hg-red text-xl font-bold font-mono border border-hg-red p-4 rounded bg-hg-red/10">SIGNAL LOST: INCIDENT NOT FOUND</div>
          <Link href="/" className="text-hg-amber hover:underline mt-8 inline-block font-mono">← RETURN TO COMMAND</Link>
        </div>
      </div>
    );
  }

  const riskLevel = analysis?.risk?.risk_level || null;

  return (
    <div className="min-h-screen bg-hg-bg relative grid-overlay">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-hg-amber/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-mono mb-8 opacity-70">
           <Link href="/" className="text-hg-text-dim hover:text-hg-amber transition-colors">DASHBOARD</Link>
           <span className="text-hg-border">/</span>
           <span className="text-hg-text font-bold">INCIDENT_LOG</span>
           <span className="text-hg-border">/</span>
           <span className="text-hg-amber">{incidentId}</span>
        </div>

        {/* Header Block */}
        <div className="glass-panel p-8 rounded-lg mb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 font-bold text-9xl font-mono pointer-events-none">
              {incident.severity.substring(0, 3)}
           </div>
           
           <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
              <div className="max-w-2xl">
                 <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`text-xs font-bold font-mono px-3 py-1 rounded border ${
                        incident.severity === 'ERROR' ? 'bg-hg-red/10 text-hg-red border-hg-red/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                        incident.severity === 'WARNING' ? 'bg-hg-amber/10 text-hg-amber border-hg-amber/30' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {incident.severity}
                    </span>
                    <span className="text-xs font-bold font-mono text-hg-text px-3 py-1 rounded border border-white/10 bg-white/5">
                      MOD: {incident.module}
                    </span>
                    {incident.month_end && (
                      <span className="text-xs font-bold font-mono text-hg-amber px-3 py-1 rounded border border-hg-amber/20 bg-hg-amber/10">
                        MONTH-END CYCLE
                      </span>
                    )}
                    <span className="text-xs font-mono text-hg-text-dim ml-auto md:ml-0">
                       {new Date(incident.timestamp).toLocaleString()}
                    </span>
                 </div>
                 
                 <h1 className="text-3xl font-bold text-hg-text tracking-tight mb-2 tech-border-b pb-4">
                   {incident.title}
                 </h1>
                 <p className="text-bg-text-dim font-mono text-sm leading-relaxed opacity-80 mt-4">
                   {incident.description}
                 </p>
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                 <button
                   onClick={handleAnalyze}
                   disabled={analyzing}
                   className="btn-primary px-6 py-3 text-sm disabled:opacity-50 font-mono tracking-wide flex items-center justify-center gap-2 group"
                 >
                   {analyzing ? (
                     <>
                       <span className="animate-spin">⟳</span> RUNNING DIAGNOSTICS...
                     </>
                   ) : analysis ? (
                     <>⟳ RE-CALIBRATE</>
                   ) : (
                     <><span className="text-lg">⚡</span> INITIATE ANALYSIS</>
                   )}
                 </button>
                 
                 <button
                   onClick={handleEscalate}
                   disabled={escalating}
                   className="px-6 py-3 text-sm font-mono tracking-wide border border-hg-red/30 text-hg-red bg-hg-red/5 hover:bg-hg-red/10 transition-all uppercase flex items-center justify-center gap-2"
                 >
                   {escalating ? 'TRANSMITTING...' : '⚠ ESCALATE TO HUMAN'}
                 </button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Raw Terminal */}
             <div className="glass-panel rounded-lg overflow-hidden border border-hg-border/50">
               <div className="bg-[#0f0f11] px-4 py-2 border-b border-hg-border flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                   <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                 </div>
                 <span className="text-xs font-mono text-hg-text-dim">LOG_VIEWER_V1.0</span>
               </div>
               <div className="bg-[#0a0a0c] p-4 overflow-x-auto">
                 <pre className="text-xs font-mono text-green-500/80 leading-relaxed font-medium">
                   {JSON.stringify(incident.raw_log, null, 2)}
                 </pre>
               </div>
             </div>

             {/* Analysis Section */}
             {analysis && (
               <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                  
                  {/* Diagnosis */}
                  <div className="glass-panel p-6 rounded-lg relative">
                     <span className="absolute top-0 left-0 bg-hg-amber/20 text-hg-amber text-[10px] font-mono px-2 py-1 rounded-br-lg">
                       AI DIAGNOSIS
                     </span>
                     <h2 className="text-xl font-bold text-hg-text mb-6 mt-2">Situation Assessment</h2>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <div className="text-xs text-hg-text-dim font-mono uppercase mb-2">Technical Classification</div>
                           <div className="text-hg-text font-medium border-l-2 border-hg-amber pl-3">
                             {analysis.analysis.classification}
                           </div>
                        </div>
                        <div>
                           <div className="text-xs text-hg-text-dim font-mono uppercase mb-2">Recommended Action</div>
                           <div className={`text-sm font-mono inline-flex items-center gap-2 px-3 py-1 rounded border ${
                              analysis.decision === 'ESCALATE_TO_HUMAN' ? 'bg-hg-red/10 text-hg-red border-hg-red/30' :
                              'bg-hg-green/10 text-hg-green border-hg-green/30'
                           }`}>
                             {analysis.decision.replace(/_/g, ' ')}
                           </div>
                        </div>
                     </div>

                     <div className="mt-6">
                        <div className="text-xs text-hg-text-dim font-mono uppercase mb-2">Root Cause Analysis</div>
                        <ul className="space-y-2">
                          {analysis.analysis.probable_root_causes.map((cause, i) => (
                             <li key={i} className="flex items-start gap-3 text-sm text-hg-text bg-white/5 p-3 rounded">
                                <span className="text-hg-amber mt-0.5">►</span>
                                {cause}
                             </li>
                          ))}
                        </ul>
                     </div>
                  </div>

                  {/* Playbook */}
                  <div className="glass-panel p-0 rounded-lg overflow-hidden">
                     <div className="p-6 border-b border-hg-border bg-white/[0.02]">
                        <div className="flex justify-between items-start">
                           <div>
                              <h2 className="text-lg font-bold text-hg-text">Remediation Playbook</h2>
                              <p className="text-xs text-hg-text-dim font-mono mt-1 opacity-70">
                                 EXECUTION TIME: ~{analysis.playbook.estimated_time_minutes} MINS  |  CONFIDENCE: {Math.round(analysis.playbook.confidence * 100)}%
                              </p>
                           </div>
                           <div className="text-3xl opacity-20">🛡</div>
                        </div>
                     </div>

                     <div className="divide-y divide-hg-border/50">
                        {analysis.playbook.steps.map((step, idx) => (
                           <div key={step.step_id} className={`p-4 transition-colors ${expandedStep === step.step_id ? 'bg-hg-surface-2' : 'hover:bg-white/[0.02]'}`}>
                              <button
                                onClick={() => setExpandedStep(expandedStep === step.step_id ? null : step.step_id)}
                                className="w-full text-left flex items-start gap-4 group"
                              >
                                 <div className={`w-8 h-8 flex items-center justify-center rounded border font-mono text-sm transition-colors ${
                                    expandedStep === step.step_id ? 'bg-hg-amber text-black border-hg-amber' : 'bg-transparent text-hg-text-dim border-hg-border'
                                 }`}>
                                    {idx + 1}
                                 </div>
                                 <div className="flex-1 pt-1">
                                    <div className="flex items-center gap-3">
                                       <span className="text-sm font-medium text-hg-text group-hover:text-white transition-colors">
                                          {step.action}
                                       </span>
                                       {step.escalate_required && (
                                          <span className="text-[10px] font-bold bg-hg-red text-black px-1.5 py-0.5 rounded">
                                             HUMAN INTERVENTION
                                          </span>
                                       )}
                                    </div>
                                    <div className="text-xs font-mono text-hg-text-dim mt-1 opacity-60">
                                       {step.command_or_API}
                                    </div>
                                 </div>
                                 <div className="text-hg-text-dim group-hover:text-hg-amber transition-colors">
                                    {expandedStep === step.step_id ? 'Close' : 'Details'}
                                 </div>
                              </button>

                              {expandedStep === step.step_id && (
                                 <div className="mt-4 ml-12 p-4 bg-black/20 rounded border border-white/5 space-y-4 text-sm animate-[fadeIn_0.2s]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div>
                                          <span className="text-[10px] text-hg-amber font-mono uppercase block mb-1">Verification</span>
                                          <p className="text-hg-text opacity-90">{step.verification}</p>
                                       </div>
                                       <div>
                                          <span className="text-[10px] text-hg-red font-mono uppercase block mb-1">Rollback</span>
                                          <p className="text-hg-text opacity-90">{step.rollback}</p>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
             )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             {analysis && (
               <>
                  <div className="glass-panel p-6 rounded-lg text-center relative overflow-hidden group">
                     {/* Risk Pulse */}
                     <div className={`absolute inset-0 opacity-10 blur-xl transition-colors duration-1000 ${
                       riskLevel === 'HIGH' ? 'bg-hg-red' : riskLevel === 'MEDIUM' ? 'bg-hg-amber' : 'bg-hg-green'
                     }`}></div>
                     
                     <div className="relative z-10">
                        <div className="text-xs text-hg-text-dim font-mono uppercase tracking-wider mb-4">Risk Assessment</div>
                        <div className={`text-6xl font-bold font-mono mb-2 ${
                           riskLevel === 'HIGH' ? 'text-hg-red drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                           riskLevel === 'MEDIUM' ? 'text-hg-amber drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                           'text-hg-green drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                        }`}>
                           {Math.round(analysis.risk.risk_score * 100)}
                        </div>
                        <div className={`text-lg font-bold tracking-widest ${
                           riskLevel === 'HIGH' ? 'text-hg-red' :
                           riskLevel === 'MEDIUM' ? 'text-hg-amber' :
                           'text-hg-green'
                        }`}>
                           {riskLevel} RISK
                        </div>
                     </div>
                  </div>

                  {/* Factors */}
                  <div className="glass-panel p-5 rounded-lg">
                     <span className="text-xs text-hg-text-dim font-mono uppercase tracking-wider block mb-3">Risk Factors</span>
                     <ul className="space-y-2">
                        {analysis.risk.contributing_factors.map((factor, i) => (
                           <li key={i} className="text-xs text-hg-text bg-white/5 px-2 py-1.5 rounded border-l-2 border-hg-border">
                              {factor}
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Permissions */}
                  <div className="glass-panel p-5 rounded-lg">
                     <span className="text-xs text-hg-text-dim font-mono uppercase tracking-wider block mb-3">Required Credentials</span>
                     <div className="space-y-1">
                        {analysis.playbook.required_permissions.map((perm, i) => (
                           <div key={i} className="text-xs font-mono text-hg-amber flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-hg-amber"></span>
                              {perm}
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Audit Info */}
                  <div className="p-4 border border-hg-border/30 rounded-lg bg-black/20 opacity-60 hover:opacity-100 transition-opacity">
                     <div className="text-[10px] font-mono text-hg-text-dim space-y-1">
                        <div className="flex justify-between">
                           <span>AGENT_VERSION</span>
                           <span>{analysis.agent_version}</span>
                        </div>
                        <div className="flex justify-between">
                           <span>MODEL_HASH</span>
                           <span>{analysis.analysis.prompt_hash.substring(0,8)}...</span>
                        </div>
                        <div className="flex justify-between">
                           <span>LATENCY</span>
                           <span>0.42s</span>
                        </div>
                     </div>
                  </div>
               </>
             )}

             {!analysis && (
                <div className="glass-panel p-8 rounded-lg text-center border-dashed border-2 border-white/10 opacity-50">
                   <div className="text-3xl mb-2">🔭</div>
                   <div className="text-sm text-hg-text-dim font-mono">
                      AWAITING ANALYSIS<br/>INITIATE SCAN TO PROCEED
                   </div>
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
