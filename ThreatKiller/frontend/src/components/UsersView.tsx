import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  Activity, 
  ArrowRight,
  TrendingUp,
  X,
  User as UserIcon,
  HardDrive,
  Compass,
  Database,
  Download,
  AlertOctagon,
  LifeBuoy
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { User, RiskDetail } from '../types';

interface UsersViewProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  loading,
  error,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  
  // Selected user for the Explainable AI panel
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<RiskDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Fetch detailed risk profile when selectedUserId changes
  useEffect(() => {
    if (selectedUserId === null) {
      setSelectedUserDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      setDetailError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/risk/${selectedUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to retrieve user risk metrics.');
        }
        const data = await response.json();
        setSelectedUserDetail(data);
      } catch (err: any) {
        setDetailError(err.message || 'An error occurred while fetching risk insights.');
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedUserId]);

  const getRiskColorClass = (score: number) => {
    if (score >= 81) return 'text-risk-critical border-risk-critical bg-risk-critical/10';
    if (score >= 61) return 'text-risk-high border-risk-high bg-risk-high/10';
    if (score >= 31) return 'text-risk-medium border-risk-medium bg-risk-medium/10';
    return 'text-risk-safe border-risk-safe bg-risk-safe/10';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-risk-safe bg-risk-safe/10 border-risk-safe/25';
      case 'MFA_Required':
        return 'text-risk-medium bg-risk-medium/10 border-risk-medium/25';
      case 'Suspended':
      case 'Session_Terminated':
        return 'text-risk-critical bg-risk-critical/10 border-risk-critical/25';
      default:
        return 'text-textSecondary bg-slate-800 border-border';
    }
  };

  // Filter users list
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesRisk = riskFilter === 'All' || u.risk_status === riskFilter;
    
    return matchesSearch && matchesRole && matchesRisk;
  });

  return (
    <div className="relative min-h-[70vh]">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main list view */}
        <div className={`flex-1 space-y-4 transition-all duration-300 ${selectedUserId ? 'lg:mr-[420px]' : ''}`}>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-textPrimary">INSIDER ACCESS PROFILES</h1>
            <p className="text-textSecondary text-xs">Risk scores and behavior profiles calculated by Isolation Forest</p>
          </div>

          {/* Search and Filters Bar */}
          <div className="glass-panel p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-textSecondary" />
              <input
                type="text"
                placeholder="Search username or role..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border text-xs rounded-md pl-9 pr-4 py-2 text-textPrimary focus:outline-none focus:border-accent-blue transition"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="w-3.5 h-3.5 text-textSecondary" />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-background border border-border text-xs rounded-md px-3 py-2 text-textPrimary focus:outline-none focus:border-accent-blue transition"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="SOC Analyst">SOC Analyst</option>
                <option value="Security Manager">Security Manager</option>
                <option value="Standard Employee">Standard Employee</option>
              </select>
            </div>

            {/* Risk Filter */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <ShieldAlert className="w-3.5 h-3.5 text-textSecondary" />
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                className="bg-background border border-border text-xs rounded-md px-3 py-2 text-textPrimary focus:outline-none focus:border-accent-blue transition"
              >
                <option value="All">All Risk Levels</option>
                <option value="Safe">Safe (&lt; 30)</option>
                <option value="Medium">Medium (31-60)</option>
                <option value="High">High (61-80)</option>
                <option value="Critical">Critical (81-100)</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-slate-900/30 text-textSecondary font-semibold">
                    <th className="p-4">Username</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-center">Current Risk Score</th>
                    <th className="p-4 text-center">Risk Tier</th>
                    <th className="p-4 text-center">Access Enforcement</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-medium">
                  {filteredUsers.map(u => (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-slate-800/30 transition-colors ${selectedUserId === u.id ? 'bg-accent-blue/5' : ''}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 bg-slate-800 rounded text-textSecondary border border-border/50">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-textPrimary block">{u.username}</span>
                            <span className="text-[10px] text-textSecondary">Registered: {new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-textPrimary font-semibold">{u.role}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getRiskColorClass(u.current_risk_score)}`}>
                          {u.current_risk_score} / 100
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          u.risk_status === 'Critical' ? 'text-risk-critical border-risk-critical/30 bg-risk-critical/10' :
                          u.risk_status === 'High' ? 'text-risk-high border-risk-high/30 bg-risk-high/10' :
                          u.risk_status === 'Medium' ? 'text-risk-medium border-risk-medium/30 bg-risk-medium/10' :
                          'text-risk-safe border-risk-safe/30 bg-risk-safe/10'
                        }`}>
                          {u.risk_status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedUserId(u.id)}
                          className="px-3 py-1 bg-accent-blue text-white font-semibold text-[10px] rounded hover:bg-blue-600 transition flex items-center space-x-1 ml-auto"
                        >
                          <span>Explain Risk</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-textSecondary">
                        No users match the search query and filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Explainable AI Side Panel (Drawer) */}
        {selectedUserId && (
          <div className="w-full lg:w-[400px] bg-slate-900 border-l border-border h-full lg:fixed lg:right-0 lg:top-[64px] lg:bottom-0 p-6 overflow-y-auto space-y-6 shadow-2xl z-20">
            {/* Close Button */}
            <div className="flex justify-between items-center pb-4 border-b border-border/80">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-accent-blue" />
                <h2 className="text-sm font-bold text-textPrimary">EXPLAINABLE AI ENGINE</h2>
              </div>
              <button 
                onClick={() => setSelectedUserId(null)}
                className="p-1 hover:bg-slate-800 rounded text-textSecondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Activity className="w-8 h-8 text-accent-blue animate-pulse" />
                <span className="text-xs text-textSecondary font-semibold">Running Isolation Forest audit...</span>
              </div>
            ) : detailError ? (
              <div className="text-center py-10 space-y-2">
                <AlertOctagon className="w-10 h-10 text-risk-critical mx-auto" />
                <p className="text-xs text-textSecondary font-medium">{detailError}</p>
              </div>
            ) : selectedUserDetail ? (
              <div className="space-y-6 text-left">
                {/* User info */}
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-textPrimary">{selectedUserDetail.username}</h3>
                  <p className="text-[11px] text-textSecondary uppercase font-bold tracking-wide">
                    {selectedUserDetail.role} | STATUS: <span className="text-textPrimary">{selectedUserDetail.status}</span>
                  </p>
                </div>

                {/* Score Widget */}
                <div className="flex items-center space-x-4 bg-background/50 border border-border/60 p-4 rounded-lg">
                  <div className="relative">
                    {/* Ring score */}
                    <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center font-extrabold text-lg bg-slate-900 border-border" 
                      style={{ 
                        borderColor: 
                          selectedUserDetail.current_score > 80 ? COLORS_MAP.Critical :
                          selectedUserDetail.current_score > 60 ? COLORS_MAP.High :
                          selectedUserDetail.current_score >= 31 ? COLORS_MAP.Medium :
                          COLORS_MAP.Safe 
                      }}
                    >
                      {selectedUserDetail.current_score}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-textPrimary uppercase">Risk Score Assessment</div>
                    <div className="text-[10px] text-textSecondary">Scale 0 - 100 Risk points</div>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                        selectedUserDetail.risk_status === 'Critical' ? 'text-risk-critical border-risk-critical/30 bg-risk-critical/10' :
                        selectedUserDetail.risk_status === 'High' ? 'text-risk-high border-risk-high/30 bg-risk-high/10' :
                        selectedUserDetail.risk_status === 'Medium' ? 'text-risk-medium border-risk-medium/30 bg-risk-medium/10' :
                        'text-risk-safe border-risk-safe/30 bg-risk-safe/10'
                      }`}>
                        {selectedUserDetail.risk_status} Tier
                      </span>
                    </div>
                  </div>
                </div>

                {/* Anomaly Factors */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-widest text-textSecondary uppercase">AI Anomaly Triggers</h4>
                  <ul className="space-y-2">
                    {selectedUserDetail.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start space-x-2 bg-slate-950/40 p-2.5 rounded border border-border/30">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-risk-high shrink-0" />
                        <span className="text-xs text-textPrimary">{reason}</span>
                      </li>
                    ))}
                    {selectedUserDetail.reasons.length === 0 && (
                      <li className="text-xs text-textSecondary italic">No anomalies observed</li>
                    )}
                  </ul>
                </div>

                {/* Recommended Response */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-widest text-textSecondary uppercase">Adaptive Security Response</h4>
                  <div className="bg-slate-950/50 border border-border/80 p-3.5 rounded-md space-y-2">
                    <div className="flex items-center space-x-2">
                      <LifeBuoy className="w-4 h-4 text-accent-blue" />
                      <span className="text-xs font-bold text-textPrimary">Enforced Policy: {selectedUserDetail.active_response}</span>
                    </div>
                    <div className="space-y-1.5 pl-6">
                      {selectedUserDetail.recommendations.map((rec, idx) => (
                        <div key={idx} className="text-[11px] text-textSecondary list-disc">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk History Timeline */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-widest text-textSecondary uppercase">Risk History Trend</h4>
                  <div className="h-[120px] bg-background/50 border border-border/60 rounded p-2">
                    {selectedUserDetail.history.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedUserDetail.history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="timestamp" stroke="#9ca3af" fontSize={8} tickLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={8} tickLine={false} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f9fafb', fontSize: 9 }} />
                          <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="url(#scoreGlow)" name="Risk Score" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-textSecondary italic">
                        No historical evaluations recorded
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold tracking-widest text-textSecondary uppercase">Learnt Behavior Baselines</h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-950/30 p-2 border border-border/30 rounded flex items-center space-x-2">
                      <Compass className="w-3.5 h-3.5 text-accent-blue" />
                      <div>
                        <span className="block text-textSecondary">Normal Hours</span>
                        <span className="text-textPrimary font-semibold">{users.find(u => u.id === selectedUserId)?.behavior_profile?.normal_hours}</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/30 p-2 border border-border/30 rounded flex items-center space-x-2">
                      <HardDrive className="w-3.5 h-3.5 text-accent-blue" />
                      <div>
                        <span className="block text-textSecondary">Known Devices</span>
                        <span className="text-textPrimary font-semibold">{users.find(u => u.id === selectedUserId)?.behavior_profile?.known_devices.length} Registered</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/30 p-2 border border-border/30 rounded flex items-center space-x-2">
                      <Download className="w-3.5 h-3.5 text-accent-blue" />
                      <div>
                        <span className="block text-textSecondary">Avg Download</span>
                        <span className="text-textPrimary font-semibold">{users.find(u => u.id === selectedUserId)?.behavior_profile?.avg_download_mb} MB</span>
                      </div>
                    </div>
                    <div className="bg-slate-950/30 p-2 border border-border/30 rounded flex items-center space-x-2">
                      <Database className="w-3.5 h-3.5 text-accent-blue" />
                      <div>
                        <span className="block text-textSecondary">Access databases</span>
                        <span className="text-textPrimary font-semibold truncate max-w-[80px] block">
                          {users.find(u => u.id === selectedUserId)?.behavior_profile?.freq_databases.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

const COLORS_MAP = {
  Safe: '#10b981',
  Medium: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444'
};
