/**
 * Notifications page — table of all notification events with status filters.
 *
 * Live data:
 *   - GET /notifications?status=xxx → filtered list
 *   - GET /clients → for displaying client names
 *
 * Locked:
 *   - Retry per notification (needs POST /notifications/:id/retry)
 *   - Bulk retry
 *   - Export
 */
import React, { useCallback, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { usePolling } from '../hooks/usePolling';
import { fetchNotifications, fetchClients } from '../api/client';
import type { NotificationEvent, Client } from '../types';

type FilterStatus = 'all' | 'pending' | 'sent' | 'failed';

const FILTER_TABS: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Sent', value: 'sent' },
  { label: 'Failed', value: 'failed' },
];

export function NotificationsPage() {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const fetchFn = useCallback(async () => {
    const [notifications, clients] = await Promise.all([
      fetchNotifications(filter !== 'all' ? { status: filter } : undefined),
      fetchClients().catch(() => [] as Client[]),
    ]);
    const clientMap = new Map(clients.map(c => [c.id, c.name]));
    return { notifications, clientMap };
  }, [filter]);

  const { data, loading, error, refresh } = usePolling(fetchFn, 12000);

  const notifications = data?.notifications ?? null;
  const clientMap = data?.clientMap ?? new Map<string, string>();

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === tab.value
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card title={`Notifications${notifications ? ` (${notifications.length})` : ''}`}>
        {loading && !notifications ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !notifications?.length ? (
          <EmptyState icon="🔔" title="No notifications found" description="Notifications appear here once tasks are processed." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">ID</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Client</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Type</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Created</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Updated</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n: NotificationEvent) => (
                  <tr
                    key={n.id}
                    className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{n.id.slice(0, 8)}…</td>
                    <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300 text-xs">
                      {clientMap.get(n.client_id) ?? (
                        <span className="font-mono text-slate-400">{n.client_id.slice(0, 8)}…</span>
                      )}
                    </td>
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
                    <td className="px-5 py-2.5 text-xs text-slate-400">
                      {n.created_at ? new Date(n.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-slate-400">
                      {n.updated_at ? new Date(n.updated_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-2.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        locked
                        lockMessage="Retry — coming soon"
                      >
                        Retry
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            locked
            lockMessage="Export — coming soon"
          >
            Export CSV
          </Button>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              locked
              lockMessage="Bulk retry — coming soon"
            >
              Retry All Failed
            </Button>
            <Button variant="secondary" size="sm" onClick={refresh} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

