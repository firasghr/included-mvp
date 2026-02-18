export interface Task {
  id: string;
  input: string;
  output: string | null;
  status: 'processing' | 'done' | 'failed';
  client_id: string;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}
