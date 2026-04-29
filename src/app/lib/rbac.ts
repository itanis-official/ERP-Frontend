export type AppRole = 'super_admin' | 'rh' | 'chef_projet' | 'agent'

function normalizeToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function normalizeRole(rawRole?: string | null): AppRole {
  const token = normalizeToken(rawRole || '')

  if (token.includes('superadmin') || token === 'admin' || token.includes('administrateur')) {
    return 'super_admin'
  }

  if (token.includes('rh') || token.includes('ressourceshumaines') || token.includes('humanresources')) {
    return 'rh'
  }

  if (token.includes('chefprojet') || token.includes('manager') || token.includes('lead')) {
    return 'chef_projet'
  }

  return 'agent'
}

export function canAccessModule(role: AppRole, module: 'rh' | 'crm'): boolean {
  if (module === 'crm') {
    return role === 'super_admin'
  }
  return true
}

const RH_PATH_ACCESS: Record<string, AppRole[]> = {
  '/rh/dashboard': ['super_admin', 'rh', 'chef_projet', 'agent'],
  '/rh/personnel': ['super_admin', 'rh'],
  '/rh/contractors': ['super_admin', 'rh'],
  '/rh/leave-requests': ['super_admin', 'rh', 'chef_projet', 'agent'],
  '/rh/teletravail': ['super_admin', 'rh', 'chef_projet', 'agent'],
  '/rh/exit-authorizations': ['super_admin', 'rh', 'chef_projet', 'agent'],
  '/rh/validations': ['super_admin', 'rh', 'chef_projet'],
  '/rh/calendar': ['super_admin', 'rh', 'chef_projet', 'agent'],
  '/rh/equipes': ['super_admin', 'rh'],
}

export function canAccessRhPath(role: AppRole, path: string): boolean {
  const exact = RH_PATH_ACCESS[path]
  if (exact) {
    return exact.includes(role)
  }

  if (path.startsWith('/rh/personnel/')) {
    return RH_PATH_ACCESS['/rh/personnel'].includes(role)
  }

  if (path.startsWith('/rh/contractors/')) {
    return RH_PATH_ACCESS['/rh/contractors'].includes(role)
  }

  return true
}

export function getDefaultPathForRole(role: AppRole, module: 'rh' | 'crm' = 'rh'): string {
  if (module === 'crm') {
    return canAccessModule(role, 'crm') ? '/crm/dashboard' : '/rh/dashboard'
  }

  if (role === 'agent') {
    return '/rh/leave-requests'
  }

  return '/rh/dashboard'
}

export function hasAnyRole(currentRole: AppRole, allowedRoles: AppRole[]): boolean {
  return allowedRoles.includes(currentRole)
}
