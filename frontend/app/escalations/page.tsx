'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Escalation {
  escalation_id: string;
  incident_id: string;
  reason: string;
  required_role: string;
  status: string;
  timestamp: string;
  snapshot: any;
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscalations = async () => {
      try {
        const res = await fetch('/api/escalations');
        const data = await res.json();
        if (Array.isArray(data)) {
          setEscalations(data);
        }
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEscalations();
  }, []);

  const handleAcknowledge = async (escalationId: string) => {
    try {
      await fetch(`/api/escalations/${escalationId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: 'dashboard_admin' })
      });
      // Refresh
      window.location.reload();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-hg-text mb-6">Pending Escalations</h1>
      
      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-hg-text-dim">Loading...</div>
        ) : escalations.length === 0 ? (
          <div className="p-8 text-center text-hg-text-dim">No pending escalations</div>
        ) : (
          <div className="divide-y divide-hg-border">
            {escalations.map((esc) => (
              <div key={esc.escalation_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-hg-amber">{esc.escalation_id}</span>
                      <span className={`text-xs px-2 py-0.5 ${
                        esc.status === 'pending' ? 'bg-hg-amber/20 text-hg-amber border border-hg-amber/30' :
                        'bg-hg-green/20 text-hg-green border border-hg-green/30'
                      }`}>
                        {esc.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-hg-text mt-2">{esc.reason}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-hg-text-dim">
                      <Link href={`/incidents/${esc.incident_id}`} className="hover:text-hg-amber">
                        Incident: {esc.incident_id}
                      </Link>
                      <span>Role: {esc.required_role}</span>
                      <span>{new Date(esc.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  {esc.status === 'pending' && (
                    <button
                      onClick={() => handleAcknowledge(esc.escalation_id)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
