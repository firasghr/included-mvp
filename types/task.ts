export interface Task {
  id: string;
  input: string;
  output: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  client_id: string;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  inbound_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Email {
  id: string;
  client_id: string;
  sender: string;
  subject: string;
  body: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  source: 'inbound';
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
