import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types
export interface Task {
  id: string;
  input_text: string;
  output_text: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Initialize Supabase client
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_KEY');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

// Database operations
export async function createTask(id: string, inputText: string): Promise<Task> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        id,
        input_text: inputText,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data as Task;
}

export async function updateTask(
  id: string,
  updates: { output_text?: string; status?: Task['status'] }
): Promise<Task> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return data as Task;
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get task: ${error.message}`);
  }

  return data as Task;
}
