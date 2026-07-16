import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Monitor
} from 'lucide-react';
import { Alert } from '../types';

interface AlertsViewProps {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onResolveAlert: (id: number) => Promise<void>;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  loading,
  error,
  onRefresh,
  onResolveAlert
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-risk-critical border-risk-critical/30 bg-risk-critical/10';
      case 'high':
        return 'text-risk-high border-risk-high/30 bg-risk-high/10';
      case 'medium':
        return 'text-risk-medium border-risk-medium/30 bg-risk-medium/10';
      default:
        return 'text-risk-safe border-risk-safe/30 bg-risk-safe/10';
    }
  };

  const handleResolve = async (id: number) => {
    setResolvingId(id);
    try {
      await onResolveAlert(id);
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = a.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResolved = resolvedFilter === 'All' || 
                            (resolvedFilter === 'Resolved' && a.is_resolved) || 
                            (resolvedFilter === 'Unresolved' && !a.is_resolved);
    const matchesSeverity = severityFilter === 'All' || a.severity === severityFilter;

    return matchesSearch && matchesResolved && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-textPrimary">INCIDENT ALERT CENTER</h1>
          <p className="text-textSecondary text-xs">Real-time alerts flagged by the AI engine requiring analyst review</p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 bg-card hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold border border-border rounded-md transition"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-textSecondary" />
          <input
            type="text"
            placeholder="Search alerts by user, database, filepath..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border text-xs rounded-md pl-9 pr-4 py-2 text-textPrimary focus:outline-none focus:border-accent-blue transition"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <AlertCircle className="w-3.5 h-3.5 text-textSecondary" />
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-background border border-border text-xs rounded-md px-3 py-2 text-textPrimary focus:outline-none focus:border-accent-blue transition"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Resolution Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-textSecondary" />
          <select
            value={resolvedFilter}
            onChange={e => setResolvedFilter(e.target.value)}
            className="bg-background border border-border text-xs rounded-md px-3 py-2 text-textPrimary focus:outline-none focus:border-accent-blue transition"
          >
            <option value="All">All Statuses</option>
            <option value="Unresolved">Unresolved</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`glass-panel p-5 rounded-lg border-l-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-glow ${
              alert.is_resolved ? 'border-l-risk-safe/40 opacity-75' :
              alert.severity === 'Critical' ? 'border-l-risk-critical critical-pulse-card' :
              alert.severity === 'High' ? 'border-l-risk-high' :
              alert.severity === 'Medium' ? 'border-l-risk-medium' :
              'border-l-accent-blue'
            }`}
          >
            {/* Left side: details */}
            <div className="space-y-2 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getSeverityBadge(alert.severity)}`}>
                  {alert.severity} Severity
                </span>
                <span className="text-textSecondary text-[10px]">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
                <span className="text-textSecondary text-[10px]">•</span>
                <span className="text-accent-blue font-bold text-[10px]">
                  User: {alert.username}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-textPrimary">{alert.title}</h3>
              <p className="text-textSecondary text-xs leading-relaxed max-w-3xl">{alert.description}</p>
              
              {/* Location and Device badges */}
              <div className="flex flex-wrap gap-2.5 pt-1 text-[10px] font-bold text-textSecondary">
                <div className="flex items-center space-x-1 bg-slate-800/50 border border-border/50 px-2 py-0.5 rounded shadow-sm">
                  <MapPin className="w-3 h-3 text-accent-blue shrink-0" />
                  <span>IP/Loc: {alert.ip_address || 'Unknown'} ({alert.country || 'Unknown'})</span>
                </div>
                <div className="flex items-center space-x-1 bg-slate-800/50 border border-border/50 px-2 py-0.5 rounded shadow-sm">
                  <Monitor className="w-3 h-3 text-accent-purple shrink-0" />
                  <span>Device: {alert.device_id || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Right side: score & resolve actions */}
            <div className="flex items-center space-x-6 shrink-0 md:border-l md:border-border/60 md:pl-6">
              {/* Score bubble */}
              <div className="text-center space-y-0.5">
                <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Risk Score</div>
                <div className="text-2xl font-extrabold text-textPrimary">{alert.risk_score}</div>
              </div>

              {/* Action button */}
              <div>
                {alert.is_resolved ? (
                  <div className="flex items-center space-x-1.5 text-risk-safe bg-risk-safe/10 border border-risk-safe/30 px-3 py-1.5 rounded-md text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolved</span>
                  </div>
                ) : (
                  <button
                    disabled={resolvingId === alert.id}
                    onClick={() => handleResolve(alert.id)}
                    className="flex items-center space-x-1.5 bg-risk-high hover:bg-orange-600 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-md text-xs font-bold transition shadow-md"
                  >
                    {resolvingId === alert.id ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Mark Resolved</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && !loading && (
          <div className="glass-panel p-10 rounded-lg text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-risk-safe mx-auto animate-pulse" />
            <h3 className="text-sm font-bold text-textPrimary uppercase">All clear! No alerts match.</h3>
            <p className="text-textSecondary text-xs max-w-sm mx-auto">
              There are currently no threat incidents matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
