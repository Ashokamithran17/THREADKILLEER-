export interface BehaviorProfile {
  normal_hours: string;
  known_devices: string[];
  known_ips: string[];
  avg_download_mb: number;
  freq_databases: string[];
}

export interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  created_at: string;
  current_risk_score: number;
  risk_status: string;
  behavior_profile?: BehaviorProfile;
}

export interface Alert {
  id: number;
  user_id: number;
  username: string;
  title: string;
  description: string;
  risk_score: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  is_resolved: boolean;
  timestamp: string;
  ip_address?: string;
  country?: string;
  device_id?: string;
}

export interface LoginLog {
  id: number;
  username: string;
  ip_address: string;
  device_id: string;
  country: string;
  is_success: boolean;
  timestamp: string;
}

export interface DashboardMetrics {
  total_users: number;
  high_risk_users: number;
  active_sessions: number;
  alerts_today: number;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface TimelineItem {
  date: string;
  alerts: number;
}

export interface LoginActivityItem {
  date: string;
  success: number;
  failed: number;
}

export interface TopUserItem {
  username: string;
  role: string;
  score: number;
  status: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  risk_distribution: ChartItem[];
  threat_timeline: TimelineItem[];
  login_activity: LoginActivityItem[];
  top_risk_users: TopUserItem[];
  recent_alerts: Alert[];
  recent_logins: LoginLog[];
}

export interface RiskHistoryItem {
  timestamp: string;
  score: number;
}

export interface RiskDetail {
  user_id: number;
  username: string;
  role: string;
  status: string;
  current_score: number;
  risk_status: string;
  reasons: string[];
  recommendations: string[];
  active_response: string;
  history: RiskHistoryItem[];
}

export interface AnalyticsData {
  risk_summary: {
    [key: string]: number;
  };
  threat_vectors: {
    vector: string;
    value: number;
  }[];
  severity_timeline: {
    date: string;
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  }[];
}
