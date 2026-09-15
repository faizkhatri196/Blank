import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { ManagerLayout } from '../layouts/ManagerLayout';
import { TechnicianLayout } from '../layouts/TechnicianLayout';

// Manager Pages
import { Dashboard } from '../pages/manager/Dashboard';
import { Tickets } from '../pages/manager/Tickets';
import { NewTicket } from '../pages/manager/NewTicket';
import { TicketDetail } from '../pages/manager/TicketDetail';
import { Technicians } from '../pages/manager/Technicians';
import { Customers } from '../pages/manager/Customers';
import { PilotInsights } from '../pages/manager/PilotInsights';
import { RealWebEvaluation } from '../pages/manager/RealWebEvaluation';
import { Settings } from '../pages/manager/Settings';

// Technician Pages
import { TechnicianDashboard } from '../pages/technician/TechnicianDashboard';
import { JobExecution } from '../pages/technician/JobExecution';
import { TechnicianProfile } from '../pages/technician/TechnicianProfile';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Manager Section */}
      <Route path="/manager" element={<ManagerLayout />}>
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="technicians" element={<Technicians />} />
        <Route path="customers" element={<Customers />} />
        <Route path="pilot-insights" element={<PilotInsights />} />
        <Route path="insights" element={<Navigate to="/manager/pilot-insights" replace />} />
        <Route path="crt-validation" element={<RealWebEvaluation />} />
        <Route path="evaluation" element={<RealWebEvaluation />} />
        <Route path="validation" element={<Navigate to="/manager/crt-validation" replace />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Technician Section */}
      <Route path="/technician" element={<TechnicianLayout />}>
        <Route index element={<Navigate to="/technician/dashboard" replace />} />
        <Route path="dashboard" element={<TechnicianDashboard />} />
        <Route path="jobs" element={<TechnicianDashboard />} />
        <Route path="jobs/:id" element={<JobExecution />} />
        <Route path="jobs/:id/execute" element={<JobExecution />} />
        <Route path="profile" element={<TechnicianProfile />} />
      </Route>

      {/* Default Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
