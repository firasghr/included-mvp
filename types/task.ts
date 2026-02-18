export interface Task {
  id: string;
  input: string;
  output: string | null;
  status: 'processing' | 'done' | 'failed';
  created_at?: string;
}
