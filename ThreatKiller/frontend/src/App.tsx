import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  ShieldAlert, 
  Terminal as TerminalIcon, 
  LogOut, 
  Shield, 
  Menu, 
  X,
  Lock,
  User as UserIcon,
  Fingerprint,
  RefreshCw
} from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { UsersView } from './components/UsersView';
import { AlertsView } from './components/AlertsView';
import { SimulatorView } from './components/SimulatorView';
import { DashboardData, User, Alert } from './types';

export const App: React.FC = () => {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [userStatus, setUserStatus] = useState<string | null>(localStorage.getItem('status'));

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'alerts' | 'simulator'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // App Data State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [alertsList, setAlertsList] = useState<Alert[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; title: string; description: string; severity: string }[]>([]);

  // Helper to compare and display toasts/voice warnings for new alerts
  const updateAlertsListAndCheckForNew = (incomingAlerts: Alert[]) => {
    setAlertsList(prev => {
      if (prev.length > 0) {
        const newAlerts = incomingAlerts.filter(a => !a.is_resolved && !prev.some(existing => existing.id === a.id));
        if (newAlerts.length > 0) {
          newAlerts.forEach(a => {
            const toastId = Math.random().toString();
            setToasts(t => [...t, {
              id: toastId,
              title: a.title,
              description: `Risk: ${a.risk_score} pts | User: ${a.username}`,
              severity: a.severity
            }]);
            
            // Auto remove after 6 seconds
            setTimeout(() => {
              setToasts(t => t.filter(toast => toast.id !== toastId));
            }, 6000);
          });
        }
      }
      return incomingAlerts;
    });
  };

  const pollAlerts = async () => {
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/alerts', { headers });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) return;
      const alertsData = await res.json();
      updateAlertsListAndCheckForNew(alertsData);
    } catch (e) {
      console.error("Polling error:", e);
    }
  };

  // Check login and fetch data on mount or token changes
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Set up periodic background polling (every 5 seconds) to check for new alerts
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      pollAlerts();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchData = async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch Dashboard
      const dashRes = await fetch('/api/dashboard', { headers });
      if (dashRes.status === 401) {
        handleLogout();
        return;
      }
      if (!dashRes.ok) throw new Error('Failed to retrieve dashboard feed.');
      const dashData = await dashRes.json();
      setDashboardData(dashData);

      // Fetch Users
      const usersRes = await fetch('/api/users', { headers });
      if (usersRes.status === 401) {
        handleLogout();
        return;
      }
      if (!usersRes.ok) throw new Error('Failed to retrieve users directory.');
      const usersData = await usersRes.json();
      setUsersList(usersData);

      // Fetch Alerts
      const alertsRes = await fetch('/api/alerts', { headers });
      if (alertsRes.status === 401) {
        handleLogout();
        return;
      }
      if (!alertsRes.ok) throw new Error('Failed to retrieve alerts database.');
      const alertsData = await alertsRes.json();
      updateAlertsListAndCheckForNew(alertsData);

      // Update current user's own status in local state if they are in the user list
      const self = usersData.find((u: User) => u.username === username);
      if (self) {
        setUserStatus(self.status);
        localStorage.setItem('status', self.status);
        if (self.status === 'Suspended' || self.status === 'Session_Terminated') {
          handleLogout();
          alert('Your session has been terminated by the Adaptive Response Engine due to security policies.');
        }
      }

    } catch (err: any) {
      setDataError(err.message || 'An error occurred while communicating with the security gateway.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Authentication failed.');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', data.username);
      localStorage.setItem('status', data.status);

      setToken(data.access_token);
      setRole(data.role);
      setUsername(data.username);
      setUserStatus(data.status);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect credentials or database server offline.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUsername(null);
    setUserStatus(null);
    setDashboardData(null);
    setUsersList([]);
    setAlertsList([]);
  };

  const handleResolveAlert = async (id: number) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`/api/alerts/${id}/resolve`, {
        method: 'POST',
        headers
      });
      if (!response.ok) throw new Error('Failed to resolve alert');
      
      // Update local state instantly and re-fetch dashboard
      setAlertsList(prev => prev.map(a => a.id === id ? { ...a, is_resolved: true } : a));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Navigations
  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Insider Directory', icon: UsersIcon },
    { id: 'alerts', label: 'Alert Center', icon: ShieldAlert },
    { id: 'simulator', label: 'Attack Simulator', icon: TerminalIcon },
  ];

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 cyber-grid">
        <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl border border-border/80 shadow-2xl relative">
          
          {/* Decorative glowing background accent */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-accent-purple/10 rounded-full blur-3xl" />

          <div className="text-center space-y-2 relative z-10">
            <div className="mx-auto h-12 w-12 rounded-xl bg-accent-blue/10 border border-accent-blue/40 flex items-center justify-center text-accent-blue shadow-glow">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-textPrimary uppercase">ThreatKiller</h2>
            <p className="text-xs text-textSecondary font-medium">Privileged Access Threat Intelligence Portal</p>
          </div>

          <form className="mt-8 space-y-5 relative z-10" onSubmit={handleLogin}>
            {loginError && (
              <div className="bg-risk-critical/10 border border-risk-critical/30 text-risk-critical text-xs px-4 py-3 rounded-lg flex items-center space-x-2 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username field */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold tracking-widest text-textSecondary uppercase">Security Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4.5 w-4.5 text-textSecondary" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="Enter username (e.g. admin)"
                    className="w-full bg-background border border-border text-xs rounded-md pl-9 pr-4 py-2.5 text-textPrimary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition font-medium"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold tracking-widest text-textSecondary uppercase">Access Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-textSecondary" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter password (e.g. password123)"
                    className="w-full bg-background border border-border text-xs rounded-md pl-9 pr-4 py-2.5 text-textPrimary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-xs font-bold rounded-md text-white bg-accent-blue hover:bg-blue-600 focus:outline-none disabled:opacity-50 transition shadow-md"
            >
              {loginLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>ACCESS SECURE WORKSPACE</span>
              )}
            </button>

            <div className="text-[10px] text-textSecondary text-center pt-2 font-medium border-t border-border/40">
              Demo Credentials: <span className="text-textPrimary font-bold">admin</span> / <span className="text-textPrimary font-bold">password123</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="h-[64px] border-b border-border bg-slate-900/50 backdrop-blur px-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue shadow-glow">
            <Shield className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-sm tracking-wide text-textPrimary uppercase">ThreatKiller</span>
        </div>

        {/* Global Security Status and User Menu */}
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-2 text-[10px] font-bold bg-risk-safe/10 border border-risk-safe/30 text-risk-safe px-2.5 py-1 rounded shadow-glowEmerald">
            <span className="h-1.5 w-1.5 rounded-full bg-risk-safe animate-ping" />
            <span>ML SURVEILLANCE ONLINE</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="block text-xs font-bold text-textPrimary leading-none">{username}</span>
              <span className="text-[9px] text-textSecondary uppercase font-bold tracking-wider">{role}</span>
            </div>
            
            {/* Logout button */}
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 text-textSecondary hover:text-risk-critical border border-transparent hover:border-border/60 rounded-md transition"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Adaptive response banner */}
      {userStatus === 'MFA_Required' && (
        <div className="bg-risk-medium/10 border-b border-risk-medium/30 text-risk-medium px-6 py-2.5 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <Fingerprint className="w-4 h-4 animate-pulse" />
            <span>ADAPTIVE RESPONSE TRIGGERED: Multi-Factor Authentication is temporarily required for all actions on your account.</span>
          </div>
        </div>
      )}

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Left Navigation Sidebar */}
        <nav className="w-full md:w-[240px] bg-slate-900/30 md:border-r border-border p-4 flex md:flex-col space-y-0 md:space-y-1.5 overflow-x-auto md:overflow-x-visible shrink-0 gap-2 md:gap-0">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md text-xs font-bold transition shrink-0 ${
                  active 
                    ? 'bg-accent-blue text-white shadow-glow border border-accent-blue/40' 
                    : 'text-textSecondary hover:text-textPrimary hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Container */}
        <main className="flex-1 p-6 overflow-y-auto max-w-full">
          {dataError && (
            <div className="bg-risk-critical/10 border border-risk-critical/30 text-risk-critical text-xs px-4 py-3 rounded-lg mb-6 flex items-center space-x-2 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{dataError}</span>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView 
              data={dashboardData}
              loading={loadingData}
              error={dataError}
              onRefresh={fetchData}
              onNavigateToUsers={() => setActiveTab('users')}
              onNavigateToAlerts={() => setActiveTab('alerts')}
            />
          )}

          {activeTab === 'users' && (
            <UsersView 
              users={usersList}
              loading={loadingData}
              error={dataError}
              onRefresh={fetchData}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView 
              alerts={alertsList}
              loading={loadingData}
              error={dataError}
              onRefresh={fetchData}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorView 
              onRefreshDashboard={fetchData}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="h-[40px] border-t border-border bg-slate-900/50 px-6 flex justify-between items-center text-[10px] text-textSecondary font-semibold">
        <span>© 2026 ThreatKiller. Deep Learning Security.</span>
        <span>Version 1.0.0 (Production Build)</span>
      </footer>

      {/* Real-time Toast Notifications Container */}
      <div className="fixed top-6 right-6 z-50 space-y-3 pointer-events-none">
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%) translateY(0); opacity: 0; }
            to { transform: translateX(0) translateY(0); opacity: 1; }
          }
          .animate-slideIn {
            animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`pointer-events-auto w-80 p-4 rounded-xl border shadow-2xl transition-all transform duration-300 translate-y-0 opacity-100 flex items-start space-x-3 backdrop-blur bg-slate-950/95 animate-slideIn ${
              toast.severity === 'Critical' ? 'border-risk-critical/60 shadow-glowRed/40' :
              toast.severity === 'High' ? 'border-risk-high/60 shadow-glowOrange/40' :
              toast.severity === 'Medium' ? 'border-risk-medium/60 shadow-glowYellow/40' :
              'border-accent-blue/60 shadow-glowBlue/40'
            }`}
          >
            <div className={`p-1.5 rounded-lg border shrink-0 ${
              toast.severity === 'Critical' ? 'bg-risk-critical/10 border-risk-critical/30 text-risk-critical' :
              toast.severity === 'High' ? 'bg-risk-high/10 border-risk-high/30 text-risk-high' :
              toast.severity === 'Medium' ? 'bg-risk-medium/10 border-risk-medium/30 text-risk-medium' :
              'bg-accent-blue/10 border-accent-blue/30 text-accent-blue'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1 text-left">
              <div className="text-[9px] font-extrabold tracking-widest text-textSecondary uppercase flex items-center justify-between">
                <span>{toast.severity} Alert Triggered</span>
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              </div>
              <h4 className="text-xs font-bold text-textPrimary leading-tight">{toast.title}</h4>
              <p className="text-[10px] text-textSecondary font-semibold leading-relaxed">{toast.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
