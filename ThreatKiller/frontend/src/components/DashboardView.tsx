import React from 'react';
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  AlertTriangle, 
  UserCheck, 
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DashboardData } from '../types';

interface DashboardViewProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNavigateToUsers: () => void;
  onNavigateToAlerts: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  loading,
  error,
  onRefresh,
  onNavigateToUsers,
  onNavigateToAlerts
}) => {
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-accent-blue animate-spin" />
        <span className="text-textSecondary text-sm font-medium">Gathering SOC security feed data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-risk-critical animate-pulse" />
        <h3 className="text-lg font-bold text-textPrimary">Failed to connect to SOC backend</h3>
        <p className="text-textSecondary text-sm max-w-md">{error}</p>
        <button 
          onClick={onRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-card border border-border rounded-md hover:bg-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, risk_distribution, threat_timeline, login_activity, top_risk_users, recent_alerts, recent_logins } = data;

  // Chart Colors mapping
  const COLORS = {
    Safe: '#10b981',     // emerald-500
    Medium: '#f59e0b',   // amber-500
    High: '#f97316',     // orange-500
    Critical: '#ef4444'  // red-500
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-risk-critical bg-risk-critical/10 border-risk-critical/30';
      case 'high': return 'text-risk-high bg-risk-high/10 border-risk-high/30';
      case 'medium': return 'text-risk-medium bg-risk-medium/10 border-risk-medium/30';
      default: return 'text-risk-safe bg-risk-safe/10 border-risk-safe/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-textPrimary">SOC CONTROL CENTER</h1>
          <p className="text-textSecondary text-xs">Real-time Privileged Access Monitor & Threat Intelligence</p>
        </div>
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 bg-card hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold border border-border rounded-md transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh Feed'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="glass-panel p-5 rounded-lg flex items-center justify-between shadow-glow">
          <div className="space-y-1">
            <span className="text-textSecondary text-xs font-semibold tracking-wide uppercase">Total Insiders</span>
            <div className="text-3xl font-extrabold text-textPrimary">{metrics.total_users}</div>
            <div className="text-[10px] text-accent-blue font-medium">Mapped behavior profiles</div>
          </div>
          <div className="p-3 bg-accent-blue/10 border border-accent-blue/30 rounded-lg text-accent-blue">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* High Risk Users */}
        <div 
          onClick={onNavigateToUsers}
          className={`glass-panel p-5 rounded-lg flex items-center justify-between cursor-pointer hover:border-risk-critical/40 transition shadow-glow ${metrics.high_risk_users > 0 ? 'border-risk-critical/20 critical-pulse-card' : ''}`}
        >
          <div className="space-y-1">
            <span className="text-textSecondary text-xs font-semibold tracking-wide uppercase">High Risk Users</span>
            <div className="text-3xl font-extrabold text-risk-critical">{metrics.high_risk_users}</div>
            <div className="text-[10px] text-risk-critical font-medium">Enforcing adaptive responses</div>
          </div>
          <div className="p-3 bg-risk-critical/10 border border-risk-critical/30 rounded-lg text-risk-critical">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Alerts Today */}
        <div 
          onClick={onNavigateToAlerts}
          className="glass-panel p-5 rounded-lg flex items-center justify-between cursor-pointer hover:border-risk-medium/40 transition shadow-glow"
        >
          <div className="space-y-1">
            <span className="text-textSecondary text-xs font-semibold tracking-wide uppercase">Alerts Generated</span>
            <div className="text-3xl font-extrabold text-risk-medium">{metrics.alerts_today}</div>
            <div className="text-[10px] text-risk-medium font-medium">Requires analyst triage</div>
          </div>
          <div className="p-3 bg-risk-medium/10 border border-risk-medium/30 rounded-lg text-risk-medium">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Active Sessions */}
        <div className="glass-panel p-5 rounded-lg flex items-center justify-between shadow-glow">
          <div className="space-y-1">
            <span className="text-textSecondary text-xs font-semibold tracking-wide uppercase">Active Sessions</span>
            <div className="text-3xl font-extrabold text-risk-safe">{metrics.active_sessions}</div>
            <div className="text-[10px] text-risk-safe font-medium">Under active ML surveillance</div>
          </div>
          <div className="p-3 bg-risk-safe/10 border border-risk-safe/30 rounded-lg text-risk-safe">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="glass-panel p-5 rounded-lg flex flex-col h-[320px]">
          <h2 className="text-sm font-bold text-textPrimary mb-4">RISK PROFILE DISTRIBUTION</h2>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={risk_distribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {risk_distribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb' }}
                  itemStyle={{ color: '#f9fafb' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-textSecondary font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Timeline */}
        <div className="glass-panel p-5 rounded-lg flex flex-col h-[320px] lg:col-span-2">
          <h2 className="text-sm font-bold text-textPrimary mb-4">THREAT INCIDENT TIMELINE (7 DAYS)</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={threat_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="alertGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb' }} />
                <Area type="monotone" dataKey="alerts" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#alertGlow)" name="Alerts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Login Activity */}
        <div className="glass-panel p-5 rounded-lg flex flex-col h-[320px] lg:col-span-2">
          <h2 className="text-sm font-bold text-textPrimary mb-4">LOGIN TRAFFIC ACTIVITY (7 DAYS)</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={login_activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb' }} />
                <Legend iconType="rect" formatter={(value) => <span className="text-xs text-textSecondary font-medium">{value === 'success' ? 'Successful Logins' : 'Failed Logins'}</span>} />
                <Bar dataKey="success" stackId="a" fill="#10b981" maxBarSize={25} name="success" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" maxBarSize={25} name="failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Risk Users */}
        <div className="glass-panel p-5 rounded-lg flex flex-col h-[320px]">
          <h2 className="text-sm font-bold text-textPrimary mb-3">TOP INSIDER RISK PROFILES</h2>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            {top_risk_users.map((u, i) => (
              <div key={i} className="bg-background/40 border border-border/40 p-3 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-textPrimary">{u.username}</span>
                    <span className="text-[10px] text-textSecondary">{u.role}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                    u.status === 'Critical' ? 'text-risk-critical border-risk-critical/30 bg-risk-critical/10' :
                    u.status === 'High' ? 'text-risk-high border-risk-high/30 bg-risk-high/10' :
                    'text-risk-medium border-risk-medium/30 bg-risk-medium/10'
                  }`}>
                    {u.score} pts
                  </span>
                </div>
                
                {/* Visual score slider bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      u.score > 80 ? 'bg-risk-critical' :
                      u.score > 60 ? 'bg-risk-high' :
                      'bg-risk-medium'
                    }`}
                    style={{ width: `${u.score}%` }}
                  />
                </div>
              </div>
            ))}
            {top_risk_users.length === 0 && (
              <div className="flex h-full items-center justify-center text-xs text-textSecondary">
                No elevated risk profiles detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lists Row: Recent Alerts and Recent Logins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="glass-panel p-5 rounded-lg flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-textPrimary">RECENT THREAT ALERTS</h2>
            <button 
              onClick={onNavigateToAlerts}
              className="text-accent-blue hover:text-blue-400 text-xs font-semibold flex items-center space-x-1"
            >
              <span>View All Alerts</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto min-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-textSecondary font-semibold">
                  <th className="py-2.5">Insider</th>
                  <th className="py-2.5">Alert Details</th>
                  <th className="py-2.5 text-center">Score</th>
                  <th className="py-2.5 text-center">Severity</th>
                  <th className="py-2.5 text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {recent_alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/25">
                    <td className="py-3 font-semibold text-textPrimary">{alert.username}</td>
                    <td className="py-3 pr-2">
                      <div className="truncate max-w-[160px] text-textPrimary">{alert.title}</div>
                      <div className="text-[10px] text-textSecondary truncate max-w-[160px]">{alert.description}</div>
                      <div className="flex items-center space-x-1.5 text-[9px] font-semibold text-textSecondary/80 mt-0.5">
                        <span className="text-accent-blue">{alert.ip_address}</span>
                        <span>({alert.country})</span>
                        <span>•</span>
                        <span>{alert.device_id}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center font-bold text-textPrimary">{alert.risk_score}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {alert.is_resolved ? (
                        <span className="text-[10px] text-risk-safe font-semibold flex items-center justify-end space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-risk-high font-semibold flex items-center justify-end space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Triage</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {recent_alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-textSecondary">
                      No security alerts generated today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Logins */}
        <div className="glass-panel p-5 rounded-lg flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-textPrimary">RECENT USER ACCESS LOGS</h2>
            <div className="text-[10px] text-textSecondary font-semibold">Continuous ML surveillance active</div>
          </div>
          
          <div className="flex-1 overflow-x-auto min-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-textSecondary font-semibold">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">IP Address</th>
                  <th className="py-2.5">Device ID</th>
                  <th className="py-2.5">Location</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {recent_logins.map((login) => (
                  <tr key={login.id} className="hover:bg-slate-800/25">
                    <td className="py-3 font-semibold text-textPrimary">{login.username}</td>
                    <td className="py-3 text-textSecondary font-mono">{login.ip_address}</td>
                    <td className="py-3 text-textSecondary font-mono">{login.device_id}</td>
                    <td className="py-3 text-textPrimary">{login.country}</td>
                    <td className="py-3 text-center">
                      <div className="flex justify-center">
                        {login.is_success ? (
                          <CheckCircle className="w-4 h-4 text-risk-safe" />
                        ) : (
                          <XCircle className="w-4 h-4 text-risk-critical" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right text-[10px] text-textSecondary">
                      {new Date(login.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {recent_logins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-textSecondary">
                      No user login sessions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
