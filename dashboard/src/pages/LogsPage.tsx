/**
 * Logs page — shows system logs from the orchestrator and tasks.
 *
 * Fully locked: live log streaming is not yet implemented.
 * Shows a visual placeholder to make the intent clear.
 */
import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LockedFeature } from '../components/ui/LockedFeature';

const PLACEHOLDER_LOGS = [
  { time: '06:12:44', level: 'INFO',  client: 'client-1', message: 'Task created: abc-123' },
  { time: '06:12:45', level: 'INFO',  client: 'client-1', message: 'Processing task abc-123 with LLM…' },
  { time: '06:12:47', level: 'INFO',  client: 'client-1', message: 'Summary created for task abc-123' },
  { time: '06:12:47', level: 'INFO',  client: 'client-1', message: 'Notification event created (email)' },
  { time: '06:12:48', level: 'WARN',  client: 'client-2', message: 'Retry 1/3 for notification def-456' },
  { time: '06:12:52', level: 'ERROR', client: 'client-2', message: 'Failed to send email: SMTP timeout' },
  { time: '06:13:00', level: 'INFO',  client: 'system',   message: 'Email worker: processed 3 notifications' },
];

const LEVEL_CLASSES: Record<string, string> = {
  INFO:  'text-sky-400',
  WARN:  'text-amber-400',
  ERROR: 'text-rose-400',
};

export function LogsPage() {
  return (
    <div className="space-y-6">
      {/* Search/filter bar — locked */}
      <LockedFeature message="Log filtering — not implemented yet">
        <Card>
          <div className="flex items-center gap-3">
            <input
              readOnly
              placeholder="Search logs by date, client, or type…"
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm text-slate-500 dark:text-slate-400"
            />
            <Button variant="secondary" size="sm" disabled>Filter</Button>
            <Button variant="secondary" size="sm" disabled>Date Range</Button>
          </div>
        </Card>
      </LockedFeature>

      {/* Live log stream — locked */}
      <LockedFeature message="Live log stream — not implemented yet">
        <Card title="Live Logs — Orchestrator">
          <div className="font-mono text-xs bg-slate-950 text-slate-300 rounded-lg p-4 space-y-1 h-80 overflow-y-auto">
            {PLACEHOLDER_LOGS.map((log, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-slate-500 shrink-0">{log.time}</span>
                <span className={`shrink-0 w-12 font-bold ${LEVEL_CLASSES[log.level] ?? ''}`}>{log.level}</span>
                <span className="text-slate-400 shrink-0">[{log.client}]</span>
                <span>{log.message}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-block w-2 h-4 bg-slate-500 animate-pulse rounded-sm" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Button variant="secondary" size="sm" locked lockMessage="Export logs — not implemented yet">
              Export Logs
            </Button>
            <Button variant="secondary" size="sm" locked lockMessage="Live stream — not implemented yet">
              ▶ Live Stream
            </Button>
          </div>
        </Card>
      </LockedFeature>

      {/* Clawdbot alerts — locked */}
      <LockedFeature message="Clawdbot alerts — not implemented yet">
        <Card title="Clawdbot Alerts">
          <div className="space-y-2">
            {['High task failure rate detected', 'SMTP quota 80% used', 'LLM API latency elevated'].map((alert) => (
              <div key={alert} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
                <span className="text-rose-500">⚠</span>
                <span className="text-sm text-rose-700 dark:text-rose-300">{alert}</span>
              </div>
            ))}
          </div>
        </Card>
      </LockedFeature>
    </div>
  );
}
