/**
 * Logs page — shows recent tasks with their status and output (summary).
 * Live data from GET /task and GET /summaries.
 *
 * Locked (future):
 *   - Log filtering by date/client
 *   - Export logs
 *   - Live log stream from orchestrator
 */
import React, { useCallback, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { LockedFeature } from '../components/ui/LockedFeature';
import { usePolling } from '../hooks/usePolling';
import { fetchTasks, fetchClients } from '../api/client';
import type { Task, Client } from '../types';

const STATUS_VARIANT: Record<Task['status'], 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  completed: 'green',
  processing: 'blue',
  pending: 'yellow',
  failed: 'red',
};

export function LogsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState<string>('all');

  const fetchAll = useCallback(async () => {
    const [tasks, clients] = await Promise.all([
      fetchTasks(100),
      fetchClients().catch(() => [] as Client[]),
    ]);
    const clientMap = new Map(clients.map(c => [c.id, c.name]));
    return { tasks, clients, clientMap };
  }, []);

  const { data, loading, error, refresh } = usePolling(fetchAll, 12000);

  const filteredTasks = (data?.tasks ?? []).filter(
    (t) => clientFilter === 'all' || t.client_id === clientFilter
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Search/filter bar — client filter active, date/export locked */}
      <Card>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Clients</option>
            {(data?.clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <LockedFeature message="Date range filter — coming soon">
            <Button variant="secondary" size="sm" disabled>Date Range</Button>
          </LockedFeature>
        </div>
      </Card>

      {/* Task log table */}
      <Card title={`Tasks${filteredTasks ? ` (${filteredTasks.length})` : ''}`}>
        {loading && !data ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !filteredTasks?.length ? (
          <EmptyState
            icon="📋"
            title="No tasks yet"
            description="Tasks appear here once emails or documents are processed."
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Task ID</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Client</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Input (preview)</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Output (summary)</th>
                  <th className="text-left px-5 py-2.5 font-medium text-slate-500 dark:text-slate-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task: Task) => {
                  const isExpanded = expanded === task.id;
                  const clientName = data?.clientMap.get(task.client_id);
                  return (
                    <tr
                      key={task.id}
                      className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : task.id)}
                    >
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-400">{task.id.slice(0, 8)}…</td>
                      <td className="px-5 py-2.5 text-slate-700 dark:text-slate-300 text-xs">
                        {clientName ?? <span className="font-mono text-slate-400">{task.client_id.slice(0, 8)}…</span>}
                      </td>
                      <td className="px-5 py-2.5">
                        <Badge variant={STATUS_VARIANT[task.status]}>{task.status}</Badge>
                      </td>
                      <td className="px-5 py-2.5 text-slate-500 dark:text-slate-400 max-w-xs">
                        <span className="block truncate">
                          {isExpanded ? task.input : task.input.slice(0, 60) + (task.input.length > 60 ? '…' : '')}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-slate-600 dark:text-slate-300 max-w-xs">
                        {task.output ? (
                          <span className="block truncate">
                            {isExpanded ? task.output : task.output.slice(0, 80) + (task.output.length > 80 ? '…' : '')}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-slate-400">
                        {task.created_at ? new Date(task.created_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            locked
            lockMessage="Export logs — coming soon"
          >
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={refresh} loading={loading}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Live log stream placeholder — locked */}
      <LockedFeature message="Live log stream — coming soon">
        <Card title="Live Orchestrator Logs">
          <div className="font-mono text-xs bg-slate-950 text-slate-300 rounded-lg p-4 h-40 flex items-center justify-center">
            <span className="text-slate-500">Live streaming not yet enabled</span>
          </div>
        </Card>
      </LockedFeature>
    </div>
  );
}

