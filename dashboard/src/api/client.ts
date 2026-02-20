/**
 * API client for the Included backend.
 * All requests are proxied via Vite dev server through /api prefix.
 * In production, set VITE_API_BASE_URL to the backend URL.
 */
import axios from 'axios';
import type { Client, NotificationEvent, SystemHealth } from '../types';

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
