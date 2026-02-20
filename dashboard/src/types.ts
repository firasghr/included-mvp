/** Data models mirroring the backend types */

export interface WorkflowSettings {
  reportFrequency: 'daily' | 'weekly' | 'none';
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  workflow_settings?: WorkflowSettings;
  inbound_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationEvent {
  id: string;
  client_id: string;
  summary_id: string;
  type: 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed';
  created_at?: string;
  updated_at?: string;
  /** Client name joined from clients table (may be populated by backend) */
  client_name?: string;
}

export interface Task {
  id: string;
  input: string;
  output: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  client_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Summary {
  id: string;
  task_id: string;
  client_id: string;
  summary: string;
  created_at?: string;
}

export interface SystemHealth {
  status: 'ok' | 'error';
  timestamp: string;
}
