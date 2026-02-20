/**
 * NewClientModal — form dialog to onboard a new client.
 * Collects name, email, optional phone/WhatsApp, and workflow settings.
 * On success, displays the auto-generated forwarding email.
 */
import React, { useState } from 'react';
import clsx from 'clsx';
import { Button } from './Button';
import { Badge } from './Badge';
import type { Client, WorkflowSettings } from '../../types';
import { createClient } from '../../api/client';

interface NewClientModalProps {
  onClose: () => void;
  onCreated: (client: Client) => void;
}

const DEFAULT_WORKFLOW: WorkflowSettings = {
  reportFrequency: 'daily',
  emailNotifications: true,
  whatsappNotifications: false,
};

export function NewClientModal({ onClose, onCreated }: NewClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [workflow, setWorkflow] = useState<WorkflowSettings>({ ...DEFAULT_WORKFLOW });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdClient, setCreatedClient] = useState<Client | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const client = await createClient({
        name: name.trim(),
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        phone: phone.trim() || undefined,
        workflow_settings: workflow,
      });
      setCreatedClient(client);
      onCreated(client);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-400 dark:placeholder-slate-500';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">New Client Onboarding</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {createdClient ? (
          /* Success state */
          <div className="px-6 py-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100">Client created successfully!</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-2.5 text-sm">
              <Row label="Name" value={createdClient.name} />
              <Row label="Email" value={createdClient.email ?? '—'} />
              {createdClient.phone && <Row label="Phone / WhatsApp" value={createdClient.phone} />}
              <Row label="Client ID">
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 break-all">{createdClient.id}</span>
              </Row>
              <Row label="Forwarding Email">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sky-600 dark:text-sky-400 break-all">{createdClient.inbound_email}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createdClient.inbound_email ?? '')}
                    className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Copy to clipboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
              </Row>
              {createdClient.workflow_settings && (
                <Row label="Report Frequency">
                  <Badge variant="blue">{createdClient.workflow_settings.reportFrequency}</Badge>
                </Row>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share the forwarding email with this client so they can forward emails to be summarised by the AI assistant.
            </p>
            <div className="flex justify-end pt-1">
              <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300">
                ⚠️ {error}
              </div>
            )}

            <Field label="Full Name" required>
              <input
                className={inputClass}
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Company">
              <input
                className={inputClass}
                placeholder="Acme Corp (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </Field>

            <Field label="Phone / WhatsApp">
              <input
                type="tel"
                className={inputClass}
                placeholder="+1 555 000 0000 (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>

            {/* Workflow settings */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Workflow Settings</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Report Frequency</label>
                <select
                  className={clsx(inputClass, 'cursor-pointer')}
                  value={workflow.reportFrequency}
                  onChange={(e) => setWorkflow((w) => ({ ...w, reportFrequency: e.target.value as WorkflowSettings['reportFrequency'] }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="none">None</option>
                </select>
              </div>

              <Toggle
                label="Email notifications"
                checked={workflow.emailNotifications}
                onChange={(v) => setWorkflow((w) => ({ ...w, emailNotifications: v }))}
              />

              <Toggle
                label="WhatsApp notifications"
                checked={workflow.whatsappNotifications}
                onChange={(v) => setWorkflow((w) => ({ ...w, whatsappNotifications: v }))}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} disabled={!name.trim()}>
                Create Client
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
      {children ?? <span className="text-right text-slate-900 dark:text-slate-100">{value}</span>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500',
          checked ? 'bg-sky-600' : 'bg-slate-200 dark:bg-slate-700'
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </button>
    </label>
  );
}
