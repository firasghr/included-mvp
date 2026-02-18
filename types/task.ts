export interface Task {
  id: string;
  input: string;
  output: string | null;
  status: 'processing' | 'done' | 'failed' | 'pending' | 'completed';
  client_id: string;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
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

export interface NotificationEvent {
  id: string;
  client_id: string;
  summary_id: string;
  type: 'email' | 'whatsapp';
  status: 'pending' | 'sent' | 'failed';
  created_at?: string;
  updated_at?: string;
}
