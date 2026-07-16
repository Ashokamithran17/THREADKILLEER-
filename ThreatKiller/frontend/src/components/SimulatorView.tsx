import React, { useState } from 'react';
import { 
  Play, 
  Terminal as TerminalIcon, 
  UserX, 
  ShieldAlert, 
  Key, 
  UserCheck, 
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface SimulatorViewProps {
  onRefreshDashboard: () => void;
}

interface SimResult {
  message: string;
  target_user: string;
  risk_score: number;
  status: string;
  reasons: string[];
  action_enforced: string;
  alert_created: boolean;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ onRefreshDashboard }) => {
  const [running, setRunning] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Simulator initialized. Ready to execute insider threat scenarios...",
    "[SYSTEM] Isolation Forest ML engine online. Active threat models: 4"
  ]);
  const [latestResult, setLatestResult] = useState<SimResult | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const executeSimulation = async (type: string) => {
    setRunning(type);
    setLatestResult(null);
    addLog(`[SIMULATOR] Launching scenario: '${type}'...`);
    
    // Step-by-step console outputs for realistic simulation feedback
    setTimeout(() => {
      addLog(`[ATTACK ENGINE] Initiating threat vector vector parameters for '${type}'`);
    }, 400);

    setTimeout(() => {
      addLog(`[INJECTOR] Transmitting anomalous behavior logs to FastAPI '/simulate' API endpoint...`);
    }, 850);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ simulation_type: type })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Simulation execution failed.');
      }

      const result: SimResult = await response.json();
      
      setTimeout(() => {
        addLog(`[AI EVALUATOR] Isolation Forest predicted anomaly on user '${result.target_user}'. Anomaly Score: ${(result.risk_score / 100).toFixed(2)}`);
      }, 1300);

      setTimeout(() => {
        addLog(`[RISK ENGINE] Risk evaluated: ${result.risk_score} pts. Level: ${result.status}. Reasons: ${result.reasons.join(', ')}`);
      }, 1700);

      setTimeout(() => {
        addLog(`[ADAPTIVE RESPONSE] Enforced Action: '${result.action_enforced}'. Alert Triggered: ${result.alert_created ? 'YES' : 'NO'}`);
        addLog(`[SIMULATOR] Scenario '${type}' completed successfully.`);
        setLatestResult(result);
        setRunning(null);
        // Refresh dashboard and users data
        onRefreshDashboard();
      }, 2100);

    } catch (err: any) {
      setTimeout(() => {
        addLog(`[ERROR] Execution failed: ${err.message}`);
        setRunning(null);
      }, 1200);
    }
  };

  const clearConsole = () => {
    setLogs([`[SYSTEM] Console cleared. Simulator ready.`]);
    setLatestResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-textPrimary">ATTACK SIMULATOR</h1>
        <p className="text-textSecondary text-xs">Inject synthetic insider threats to evaluate the AI model, risk scoring, and adaptive responses in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Cards */}
        <div className="space-y-4 lg:col-span-1">
          <div className="glass-panel p-5 rounded-lg space-y-4">
            <h2 className="text-sm font-bold text-textPrimary uppercase tracking-wide flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-accent-blue" />
              <span>Scenario Control Panel</span>
            </h2>
            <p className="text-textSecondary text-xs">
              Select an attack vector below. The simulator will compile appropriate anomalous audit logs, bypass baseline filters, and report outcomes.
            </p>

            <div className="space-y-3 pt-2">
              {/* Insider Data Theft */}
              <button
                disabled={running !== null}
                onClick={() => executeSimulation('Insider Data Theft')}
                className="w-full flex items-center justify-between p-3.5 bg-background hover:bg-slate-800 disabled:opacity-50 text-left rounded-lg border border-border hover:border-risk-high transition"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-textPrimary flex items-center space-x-1.5">
                    <UserX className="w-3.5 h-3.5 text-risk-high" />
                    <span>Insider Data Theft</span>
                  </div>
                  <div className="text-[10px] text-textSecondary">Large downloads from restricted paths</div>
                </div>
                <Play className="w-3.5 h-3.5 text-textSecondary" />
              </button>

              {/* Privilege Escalation */}
              <button
                disabled={running !== null}
                onClick={() => executeSimulation('Privilege Escalation')}
                className="w-full flex items-center justify-between p-3.5 bg-background hover:bg-slate-800 disabled:opacity-50 text-left rounded-lg border border-border hover:border-accent-purple transition"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-textPrimary flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-accent-purple" />
                    <span>Privilege Escalation</span>
                  </div>
                  <div className="text-[10px] text-textSecondary">Teller accessing unauthorized payroll database</div>
                </div>
                <Play className="w-3.5 h-3.5 text-textSecondary" />
              </button>

              {/* Credential Compromise */}
              <button
                disabled={running !== null}
                onClick={() => executeSimulation('Credential Compromise')}
                className="w-full flex items-center justify-between p-3.5 bg-background hover:bg-slate-800 disabled:opacity-50 text-left rounded-lg border border-border hover:border-risk-critical transition"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-textPrimary flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-risk-critical" />
                    <span>Credential Compromise</span>
                  </div>
                  <div className="text-[10px] text-textSecondary">Off-hours brute-force from unknown location</div>
                </div>
                <Play className="w-3.5 h-3.5 text-textSecondary" />
              </button>

              {/* Malicious Admin */}
              <button
                disabled={running !== null}
                onClick={() => executeSimulation('Malicious Admin')}
                className="w-full flex items-center justify-between p-3.5 bg-background hover:bg-slate-800 disabled:opacity-50 text-left rounded-lg border border-border hover:border-risk-medium transition"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-textPrimary flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-risk-medium" />
                    <span>Malicious Admin</span>
                  </div>
                  <div className="text-[10px] text-textSecondary">Admin deleting system audit log tables</div>
                </div>
                <Play className="w-3.5 h-3.5 text-textSecondary" />
              </button>
            </div>
          </div>

          {/* Outcome Summary */}
          {latestResult && (
            <div className="glass-panel p-5 rounded-lg bg-slate-900 border border-risk-high/30 shadow-glow space-y-3 text-left">
              <h3 className="text-xs font-bold text-risk-high flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                <span>CYBER ATTACK ANALYSIS REPORT</span>
              </h3>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span className="text-textSecondary">Target Account:</span>
                  <span className="text-textPrimary font-bold">{latestResult.target_user}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span className="text-textSecondary">Risk Score:</span>
                  <span className={`font-extrabold ${latestResult.risk_score > 80 ? 'text-risk-critical' : 'text-risk-high'}`}>
                    {latestResult.risk_score} pts ({latestResult.status})
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1">
                  <span className="text-textSecondary">Response Action:</span>
                  <span className="text-textPrimary font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-border/50">
                    {latestResult.action_enforced}
                  </span>
                </div>
                
                <div className="space-y-1 pt-1">
                  <span className="text-textSecondary block">Indicators Detected:</span>
                  <div className="space-y-1">
                    {latestResult.reasons.map((r, i) => (
                      <span key={i} className="block text-[10px] text-textPrimary bg-slate-950/50 p-1.5 rounded border border-border/20">
                        • {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Terminal Log Output */}
        <div className="lg:col-span-2 flex flex-col h-[520px] glass-panel rounded-lg overflow-hidden border border-border/80 shadow-2xl">
          <div className="bg-slate-900 px-4 py-3 border-b border-border flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <TerminalIcon className="w-4 h-4 text-accent-blue" />
              <span className="text-xs font-bold text-textPrimary tracking-wide font-mono">SIMULATION_TERMINAL_FEED</span>
            </div>
            <button 
              onClick={clearConsole}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-textSecondary hover:text-textPrimary border border-border px-2.5 py-1 rounded transition font-semibold"
            >
              Clear Console
            </button>
          </div>

          <div className="flex-1 bg-black p-4 font-mono text-[10px] overflow-y-auto space-y-2 text-left text-green-400">
            {logs.map((log, idx) => {
              // Colorize specific words
              let logClass = "text-emerald-500";
              if (log.includes("[ERROR]")) logClass = "text-risk-critical font-bold";
              else if (log.includes("[SYSTEM]")) logClass = "text-accent-blue";
              else if (log.includes("[ATTACK ENGINE]")) logClass = "text-accent-purple";
              else if (log.includes("[INJECTOR]")) logClass = "text-risk-medium";
              else if (log.includes("[RISK ENGINE]")) logClass = "text-risk-high font-bold";
              else if (log.includes("[ADAPTIVE RESPONSE]")) logClass = "text-yellow-300 font-bold";
              
              return (
                <div key={idx} className={logClass}>
                  {log}
                </div>
              );
            })}
            
            {running && (
              <div className="flex items-center space-x-2 text-green-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating cyber attack payload injection...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
