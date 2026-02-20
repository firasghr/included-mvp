/**
 * Clients page — table of all clients with their last summary and notification status.
 *
 * Live data:
 *   - GET /clients     → client list
 *   - GET /notifications?clientId=xxx → per-client notification status
 *
 * Locked (not implemented):
 *   - Retry per client
 *   - Send test email
 *   - View logs per client
 */
import React, { useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { usePolling } from '../hooks/usePolling';
import { fetchClients, fetchNotifications } from '../api/client';
import type { Client, NotificationEvent } from '../types';

function lastNotifStatus(notifications: NotificationEvent[], clientId: string): NotificationEvent['status'] | null {
  const clientNotifs = notifications
    .filter((n) => n.client_id === clientId)
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : -Infinity;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : -Infinity;
      return bTime - aTime;
    });
  return clientNotifs[0]?.status ?? null;
}

export function ClientsPage() {
  const fetchAll = useCallback(async () => {
    const [clients, notifications] = await Promise.all([
      fetchClients(),
      fetchNotifications().catch(() => [] as NotificationEvent[]),
    ]);
    return { clients, notifications };
  }, []);

  const { data, loading, error, refresh } = usePolling(fetchAll, 12000);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          ⚠️ {error}
        </div>
      )}

      <Card title={`Clients (${data?.clients?.length ?? 0})`}>
        {loading && !data ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !data?.clients?.length ? (
          <EmptyState
            icon="👤"
            title="No clients yet"
            description="Create your first client via the API or CLI."
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Name</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Email</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Inbound Address</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Last Notification</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.clients.map((client: Client) => {
                  const status = lastNotifStatus(data.notifications ?? [], client.id);
                  return (
                    <tr
                      key={client.id}
                      className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {client.name}
                        {client.company && (
                          <span className="ml-1.5 text-xs text-slate-400">· {client.company}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {client.email ?? <span className="italic text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">
                        {client.inbound_email ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        {status ? (
                          <Badge
                            variant={
                              status === 'sent' ? 'green'
                              : status === 'pending' ? 'yellow'
                              : 'red'
                            }
                          >
                            {status}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {client.created_at ? new Date(client.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            locked
                            lockMessage="Retry — not implemented yet"
                          >
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            locked
                            lockMessage="Send test email — not implemented yet"
                          >
                            Test Email
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            locked
                            lockMessage="View client logs — not implemented yet"
                          >
                            Logs
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Refresh button */}
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={refresh} loading={loading}>
            Refresh
          </Button>
        </div>
      </Card>
    </div>
  );
}
