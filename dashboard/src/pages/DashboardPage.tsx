/**
 * Dashboard page — overview of system health, client count, and notification status.
 *
 * Live data sources:
 *   - GET /health           → system status
 *   - GET /clients          → total clients
 *   - GET /notifications    → pending / failed / sent counts
 *
 * Locked (not yet implemented):
 *   - Historical trend charts (emails/summaries over time)
 *   - System health per Mac
 */
import React, { useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../components/ui/Card';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LockedFeature } from '../components/ui/LockedFeature';
import { Spinner } from '../components/ui/Spinner';
import { usePolling } from '../hooks/usePolling';
import { fetchHealth, fetchClients, fetchNotifications } from '../api/client';
import type { NotificationEvent } from '../types';

// Placeholder data for the locked trend chart
const PLACEHOLDER_TREND = [
  { day: 'Mon', emails: 4, summaries: 3 },
  { day: 'Tue', emails: 7, summaries: 5 },
  { day: 'Wed', emails: 3, summaries: 3 },
  { day: 'Thu', emails: 9, summaries: 7 },
  { day: 'Fri', emails: 6, summaries: 5 },
  { day: 'Sat', emails: 2, summaries: 2 },
  { day: 'Sun', emails: 5, summaries: 4 },
];

function notifCounts(notifications: NotificationEvent[]) {
  const pending = notifications.filter((n) => n.status === 'pending').length;
  const failed  = notifications.filter((n) => n.status === 'failed').length;
  const sent    = notifications.filter((n) => n.status === 'sent').length;
  return { pending, failed, sent };
}

export function DashboardPage() {
  const fetchAll = useCallback(async () => {
    const [health, clients, notifications] = await Promise.all([
      fetchHealth().catch(() => null),
      fetchClients().catch(() => []),
      fetchNotifications().catch(() => []),
    ]);
    return { health, clients, notifications };
  }, []);

  const { data, loading, error } = usePolling(fetchAll, 12000);

  const counts = notifCounts(data?.notifications ?? []);
  const systemOnline = data?.health?.status === 'ok';

  return (
    <div className="space-y-6">
      {/* Loading / error states */}
      {loading && (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <Spinner className="h-4 w-4" /> Fetching dashboard data…
        </div>
      )}
      {error && !loading && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          ⚠️ Could not reach backend: {error}. Make sure the Included API is running on port 3000.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="System Status"
          value={loading ? '…' : systemOnline ? 'Online' : 'Offline'}
          highlight={loading ? undefined : systemOnline ? 'green' : 'red'}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <StatCard
          label="Total Clients"
          value={loading ? '…' : data?.clients?.length ?? 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Pending Notifications"
          value={loading ? '…' : counts.pending}
          highlight={counts.pending > 0 ? 'yellow' : undefined}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
        />
        <StatCard
          label="Failed Notifications"
          value={loading ? '…' : counts.failed}
          highlight={counts.failed > 0 ? 'red' : undefined}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* System health per Mac — LOCKED */}
      <LockedFeature message="Multi-Mac monitoring — not implemented yet">
        <Card title="System Health — All Macs">
          <div className="space-y-2">
            {['Mac-1 (Orchestrator)', 'Mac-2', 'Mac-3'].map((mac) => (
              <div key={mac} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-sm font-medium">{mac}</span>
                <Badge variant="green">Online</Badge>
              </div>
            ))}
          </div>
        </Card>
      </LockedFeature>

      {/* Historical trend chart — LOCKED */}
      <LockedFeature message="Historical trends — not implemented yet">
        <Card title="Emails Processed (Last 7 Days)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={PLACEHOLDER_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="emails" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="summaries" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </LockedFeature>

      {/* Recent notifications */}
      <Card title="Recent Notifications">
        {!data?.notifications?.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No notifications found.</p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-5 py-2 font-medium text-slate-500 dark:text-slate-400">ID</th>
                  <th className="text-left px-5 py-2 font-medium text-slate-500 dark:text-slate-400">Type</th>
                  <th className="text-left px-5 py-2 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-5 py-2 font-medium text-slate-500 dark:text-slate-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.notifications.slice(0, 8).map((n) => (
                  <tr key={n.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{n.id.slice(0, 8)}…</td>
                    <td className="px-5 py-2.5">
                      <Badge variant={n.type === 'email' ? 'blue' : 'gray'}>{n.type}</Badge>
                    </td>
                    <td className="px-5 py-2.5">
                      <Badge
                        variant={
                          n.status === 'sent' ? 'green'
                          : n.status === 'pending' ? 'yellow'
                          : 'red'
                        }
                      >
                        {n.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400 text-xs">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
