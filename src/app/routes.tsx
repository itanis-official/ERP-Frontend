import * as React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AppRole, canAccessModule, getDefaultPathForRole, hasAnyRole, normalizeRole } from './lib/rbac'
import { ModuleSelector } from './pages/ModuleSelector'
import { Layout } from './components/Layout'

import { Dashboard as RHDashboard } from './pages/rh/Dashboard'
import { Personnel } from './pages/rh/Personnel'
import { EmployeeDetail } from './pages/rh/EmployeeDetail'
import { Contractors } from './pages/rh/Contractors'
import { ContractorDetail } from './pages/rh/ContractorDetail'
import { LeaveRequests } from './pages/rh/LeaveRequests'
import { Teletravail } from './pages/rh/Teletravail'
import { ExitAuthorizations } from './pages/rh/ExitAuthorizations'
import { Validations } from './pages/rh/Validations'
import { HRCalendar } from './pages/rh/HRCalendar'
import { Equipes } from './pages/rh/Equipes'
import { Settings as RHSettings } from './pages/rh/Settings'
import { LoginPage as HRLoginPage } from './pages/rh/LoginPage'

import { Dashboard as CRMDashboard } from './pages/crm/Dashboard'
import { Companies } from './pages/crm/Companies'
import { CompanyDetail } from './pages/crm/CompanyDetail'
import { Contacts } from './pages/crm/Contacts'
import { Contracts } from './pages/crm/Contracts'
import { Pipeline } from './pages/crm/Pipeline'
import { Phases } from './pages/crm/Phases'
import { Settings } from './pages/crm/Settings'
import { Login as CRMLogin } from './pages/crm/Login'
import { ClientPortal } from './pages/crm/ClientPortal'

function RequireAuth() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/rh/login" replace />
  return <Outlet />
}

function RequireRole({ children, allowedRoles, fallbackTo }: {
  children: React.ReactElement
  allowedRoles: AppRole[]
  fallbackTo?: string
}) {
  const { user } = useAuth()
  const role = normalizeRole(user?.role)

  if (!hasAnyRole(role, allowedRoles)) {
    return <Navigate to={fallbackTo ?? getDefaultPathForRole(role)} replace />
  }

  return children
}

function GuestOnly({ children, to }: { children: React.ReactElement; to: string }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to={to} replace />
  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ModuleSelector />} />
      <Route path="/modules" element={<ModuleSelector />} />
      <Route path="/rh/login" element={<GuestOnly to="/rh/dashboard"><HRLoginPage /></GuestOnly>} />
      <Route path="/crm/login" element={<GuestOnly to="/crm/dashboard"><CRMLogin /></GuestOnly>} />

      <Route element={<RequireAuth />}>
        <Route path="/rh" element={<Layout />}>
          <Route index element={<RHDashboard />} />
          <Route path="dashboard" element={<RHDashboard />} />
          <Route path="personnel" element={<RequireRole allowedRoles={['super_admin', 'rh']}><Personnel /></RequireRole>} />
          <Route path="personnel/:id" element={<RequireRole allowedRoles={['super_admin', 'rh']}><EmployeeDetail /></RequireRole>} />
          <Route path="contractors" element={<RequireRole allowedRoles={['super_admin', 'rh']}><Contractors /></RequireRole>} />
          <Route path="contractors/:id" element={<RequireRole allowedRoles={['super_admin', 'rh']}><ContractorDetail /></RequireRole>} />
          <Route path="leave-requests" element={<LeaveRequests />} />
          <Route path="teletravail" element={<Teletravail />} />
          <Route path="exit-authorizations" element={<ExitAuthorizations />} />
          <Route path="validations" element={<RequireRole allowedRoles={['super_admin', 'rh', 'chef_projet']}><Validations /></RequireRole>} />
          <Route path="calendar" element={<HRCalendar />} />
          <Route path="equipes" element={<RequireRole allowedRoles={['super_admin', 'rh']}><Equipes /></RequireRole>} />
          <Route path="settings" element={<RequireRole allowedRoles={['super_admin', 'rh']}><RHSettings /></RequireRole>} />
        </Route>
        <Route path="/crm" element={<RequireRole allowedRoles={['super_admin']}><Layout /></RequireRole>}>
          <Route index element={<CRMDashboard />} />
          <Route path="dashboard" element={<CRMDashboard />} />
          <Route path="client" element={<ClientPortal />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="phases" element={<Phases />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route
          path="/dashboard"
          element={
            <RequireRole allowedRoles={['super_admin', 'rh', 'chef_projet', 'agent']}>
              <RoleAwareDefaultRedirect />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  )
}

function RoleAwareDefaultRedirect() {
  const { user } = useAuth()
  const role = normalizeRole(user?.role)
  const target = canAccessModule(role, 'crm') ? '/crm/dashboard' : getDefaultPathForRole(role, 'rh')
  return <Navigate to={target} replace />
}
