import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';

// Ensure environment variables are loaded before instantiation during imports
dotenv.config();

// Custom fetch adapter using Axios to bypass Node 22 native fetch DNS issues
const axiosFetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
  const method = options?.method || 'GET';

  // Safely parse headers into an Axios-friendly dictionary
  const axiosHeaders: Record<string, string> = {};
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        axiosHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        axiosHeaders[key] = value;
      });
    } else {
      Object.assign(axiosHeaders, options.headers);
    }
  }

  const data = options?.body;

  const response = await axios({
    url: url.toString(),
    method,
    headers: axiosHeaders,
    data,
    responseType: 'text', // Receive raw string to mock .json() and .text()
    validateStatus: () => true, // Resolve all HTTP statuses
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers as any),
    text: async () => response.data,
    json: async () => JSON.parse(response.data),
  } as any; // Cast as Response
};

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_KEY || '';

    // Fallback if env vars are missing to avoid crashing at import
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: axiosFetch,
      },
    });
  }

  return supabaseClient;
}

// Export the singleton instance directly
const supabase = getSupabaseClient();
export default supabase;