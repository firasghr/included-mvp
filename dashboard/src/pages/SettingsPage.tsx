/**
 * Settings page — configuration for the Included AI system.
 *
 * All settings are locked / not yet implemented.
 * Shown for visibility and future implementation.
 */
import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LockedFeature } from '../components/ui/LockedFeature';
import { Badge } from '../components/ui/Badge';

export function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Client forwarding emails — locked */}
      <LockedFeature message="Coming soon">
        <Card title="Client Inbound Email Configuration">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configure the domain used for client inbound email addresses (e.g. <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">client_&lt;uuid&gt;@yourdomain.com</code>).
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Inbound Email Domain</label>
              <input
                readOnly
                defaultValue="included.yourdomain.com"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm text-slate-500 dark:text-slate-400"
              />
            </div>
            <Button locked lockMessage="Not implemented yet">Save Domain</Button>
          </div>
        </Card>
      </LockedFeature>

      {/* Add / remove Macs — locked */}
      <LockedFeature message="Multi-Mac management — coming soon">
        <Card title="Connected Macs">
          <div className="space-y-2">
            {[
              { name: 'Mac-1', role: 'Orchestrator', status: 'online' },
              { name: 'Mac-2', role: 'Worker', status: 'offline' },
              { name: 'Mac-3', role: 'Worker', status: 'offline' },
            ].map((mac) => (
              <div key={mac.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div>
                  <span className="text-sm font-medium">{mac.name}</span>
                  <span className="ml-2 text-xs text-slate-400">{mac.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={mac.status === 'online' ? 'green' : 'gray'}>{mac.status}</Badge>
                  <Button size="sm" variant="danger" locked lockMessage="Remove Mac — not implemented yet">Remove</Button>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-3" variant="secondary" locked lockMessage="Add Mac — not implemented yet">
            + Add Mac
          </Button>
        </Card>
      </LockedFeature>

      {/* Alerts setup — locked */}
      <LockedFeature message="Alert integrations — coming soon">
        <Card title="Alert Integrations">
          <div className="space-y-3">
            {[
              { name: 'Slack', icon: '💬', configured: false },
              { name: 'Telegram', icon: '✈️', configured: false },
              { name: 'Email Alerts', icon: '📧', configured: false },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <span>{integration.icon}</span>
                  <span className="text-sm font-medium">{integration.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="gray">Not configured</Badge>
                  <Button size="sm" variant="secondary" locked lockMessage="Not implemented yet">Configure</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </LockedFeature>

      {/* Auto-retry settings — locked */}
      <LockedFeature message="Auto-retry configuration — coming soon">
        <Card title="Retry Settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-retry failed notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Automatically retry failed email sends</p>
              </div>
              <div className="relative">
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow"></div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Retry Interval (minutes)</label>
              <input
                readOnly
                defaultValue="15"
                className="w-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm text-slate-500 dark:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Retries</label>
              <input
                readOnly
                defaultValue="3"
                className="w-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm text-slate-500 dark:text-slate-400"
              />
            </div>
            <Button locked lockMessage="Not implemented yet">Save Retry Settings</Button>
          </div>
        </Card>
      </LockedFeature>
    </div>
  );
}
