import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAP HealthGuard | Incident Triage & Prediction',
  description: 'AI-powered SAP incident analysis, risk prediction, and automated playbook generation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-hg-bg">
        {/* Navigation Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-hg-surface/95 backdrop-blur border-b border-hg-border">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-hg-amber to-orange-600 flex items-center justify-center">
                <span className="text-black font-bold text-sm">HG</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-hg-text">SAP HealthGuard</h1>
                <p className="text-xs text-hg-text-dim font-mono">v1.0.0</p>
              </div>
            </div>
            
            <Navbar />

            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-hg-green status-dot"></div>
              <span className="text-xs text-hg-text-dim font-mono">SYSTEM ONLINE</span>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="pt-14 min-h-screen grid-overlay">
          {children}
        </main>
      </body>
    </html>
  )
}
