/**
 * App — root component with React Router setup.
 */
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LogsPage } from './pages/LogsPage';
import { WorkersPage } from './pages/WorkersPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

const ACCESS_CODE = import.meta.env.VITE_DASHBOARD_ACCESS_CODE as string | undefined;

function isAuthenticated(): boolean {
  if (!ACCESS_CODE) return true;
  return sessionStorage.getItem('dashboard-auth') === '1';
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);

  useEffect(() => {
    if (!ACCESS_CODE) setAuthed(true);
  }, []);

  if (!authed) {
    return <LoginPage onAuthenticated={() => setAuthed(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
