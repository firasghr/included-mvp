/**
 * Workers page — LLM task queue monitoring and processing pipeline overview.
 *
 * Live data sources:
 *   - GET /task        → task queue with status distribution
 *   - GET /summaries   → recently generated summaries
 *   - GET /clients     → for client name resolution
 *
 * Locked (future):
 *   - Real-time worker health metrics (CPU / RAM per Mac)
 *   - Live worker log stream
 *   - Manual worker restart
 */
import React, { useCallback } from 'react';
import { StatCard, Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { LockedFeature } from '../components/ui/LockedFeature';
import { usePolling } from '../hooks/usePolling';
import { fetchTasks, fetchSummaries, fetchClients } from '../api/client';
import type { Task, Summary, Client } from '../types';

const STATUS_VARIANT: Record<Task['status'], 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  completed: 'green',
  processing: 'blue',
  pending: 'yellow',
  failed: 'red',
};

export function WorkersPage() {
  const fetchAll = useCallback(async () => {
    const [tasks, summaries, clients] = await Promise.all([
      fetchTasks(200),
      fetchSummaries({ limit: 20 }),
      fetchClients().catch(() => [] as Client[]),
    ]);
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));
    const pending    = tasks.filter((t) => t.status === 'pending').length;
    const processing = tasks.filter((t) => t.status === 'processing').length;
    const completed  = tasks.filter((t) => t.status === 'completed').length;
    const failed     = tasks.filter((t) => t.status === 'failed').length;
    return { tasks, summaries, clientMap, pending, processing, completed, failed };
  }, []);

  const { data, loading, error, refresh } = usePolling(fetchAll, 10000);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Task status distribution */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Pending Tasks"
          value={loading ? '…' : data?.pending ?? 0}
          highlight={data?.pending ? 'yellow' : undefined}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label="Processing"
          value={loading ? '…' : data?.processing ?? 0}
          highlight={data?.processing ? 'yellow' : undefined}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={loading ? '…' : data?.completed ?? 0}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
        <StatCard
          label="Failed"
          value={loading ? '…' : data?.failed ?? 0}
          highlight={data?.failed ? 'red' : undefined}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
        />
      </div>

      {/* Active / in-queue tasks */}
      <Card title="Task Queue (Pending &amp; Processing)">
        {loading && !data ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (() => {
          const activeTasks = (data?.tasks ?? []).filter(
            (t) => t.status === 'pending' || t.status === 'processing'
          );
          return activeTasks.length === 0 ? (
            <EmptyState icon="✅" title="Queue is clear" description="No tasks pending or in progress." />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Task ID</th>
                    <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Client</th>
                    <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Input (preview)</th>
                    <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Queued At</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTasks.map((task: Task) => (
                    <tr key={task.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{task.id.slice(0, 8)}…</td>
                      <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300 text-xs">
                        {data?.clientMap.get(task.client_id) ?? (
                          <span className="font-mono text-slate-400">{task.client_id.slice(0, 8)}…</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge variant={STATUS_VARIANT[task.status]}>{task.status}</Badge>
                      </td>
                      <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400 max-w-xs">
                        <span className="block truncate">{task.input.slice(0, 80)}{task.input.length > 80 ? '…' : ''}</span>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-400">
                        {task.created_at ? new Date(task.created_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={refresh} loading={loading}>Refresh</Button>
        </div>
      </Card>

      {/* Recent summaries generated by LLM */}
      <Card title="Recent LLM Summaries">
        {loading && !data ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !data?.summaries?.length ? (
          <EmptyState icon="📝" title="No summaries yet" description="Summaries appear here after tasks are processed by the LLM." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Summary ID</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Client</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Summary (preview)</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Generated At</th>
                </tr>
              </thead>
              <tbody>
                {data.summaries.map((s: Summary) => (
                  <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{s.id.slice(0, 8)}…</td>
                    <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300 text-xs">
                      {data.clientMap.get(s.client_id) ?? (
                        <span className="font-mono text-slate-400">{s.client_id.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-slate-600 dark:text-slate-300 max-w-sm">
                      <span className="block truncate">{s.summary.slice(0, 100)}{s.summary.length > 100 ? '…' : ''}</span>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-slate-400">
                      {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Worker health — locked (requires Mac agents) */}
      <LockedFeature message="Worker health metrics — coming soon (requires Mac agents)">
        <Card title="Worker Node Health">
          <div className="space-y-3">
            {[
              { name: 'EmailWorker', host: 'Mac-1 Orchestrator', interval: '10s', status: 'running' },
              { name: 'AutomationWorker', host: 'Mac-1 Orchestrator', interval: '60s', status: 'running' },
              { name: 'LLM Worker', host: 'Mac-1 Orchestrator', interval: 'on-demand', status: 'running' },
            ].map((worker) => (
              <div key={worker.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{worker.name}</p>
                  <p className="text-xs text-slate-400">{worker.host} · every {worker.interval}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="green">{worker.status}</Badge>
                  <Button size="sm" variant="danger" locked lockMessage="Restart worker — coming soon">Restart</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </LockedFeature>

      {/* Live log stream — locked */}
      <LockedFeature message="Live worker log stream — coming soon">
        <Card title="Live Worker Logs">
          <div className="font-mono text-xs bg-slate-950 text-slate-300 rounded-lg p-4 h-40 flex items-center justify-center">
            <span className="text-slate-500">Live streaming not yet enabled</span>
          </div>
        </Card>
      </LockedFeature>
    </div>
  );
}
