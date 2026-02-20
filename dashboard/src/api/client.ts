/**
 * API client for the Included backend.
 * All requests are proxied via Vite dev server through /api prefix.
 * In production, set VITE_API_BASE_URL to the backend URL.
 */
import axios from 'axios';
import type { Client, NotificationEvent, SystemHealth, WorkflowSettings, Task, Summary } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const http = axios.create({ baseURL: BASE_URL, timeout: 10000 });

/** Health check */
export async function fetchHealth(): Promise<SystemHealth> {
  const { data } = await http.get<SystemHealth>('/health');
  return data;
}

/** List all clients */
export async function fetchClients(): Promise<Client[]> {
  const { data } = await http.get<{ success: boolean; clients: Client[] }>('/clients');
  return data.clients;
}

/** List notifications, optionally filtered by status or clientId */
export async function fetchNotifications(params?: {
  status?: string;
  clientId?: string;
}): Promise<NotificationEvent[]> {
  const { data } = await http.get<{ success: boolean; notifications: NotificationEvent[] }>(
    '/notifications',
    { params }
  );
  return data.notifications;
}

export interface CreateClientPayload {
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  workflow_settings?: WorkflowSettings;
}

/** Create a new client */
export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const { data } = await http.post<{ success: boolean; client: Client }>('/clients', payload);
  return data.client;
}

/** List recent tasks, optionally limited */
export async function fetchTasks(limit = 50): Promise<Task[]> {
  const { data } = await http.get<{ success: boolean; tasks: Task[] }>('/task', {
    params: { limit },
  });
  return data.tasks;
}

/** List recent summaries, optionally filtered by clientId */
export async function fetchSummaries(params?: { clientId?: string; limit?: number }): Promise<Summary[]> {
  const { data } = await http.get<{ success: boolean; summaries: Summary[] }>('/summaries', {
    params,
  });
  return data.summaries;
}

