import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { canAccessModule, canAccessRhPath, getDefaultPathForRole, normalizeRole } from '../lib/rbac'
import { BrandLogo } from './BrandLogo'
import { useThemeMode } from '../contexts/ThemeModeContext'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  InputBase,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  House,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Sun,
  Moon,
  Users,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const DRAWER_WIDTH = 240
const DRAWER_COLLAPSED = 72
const ORANGE = '#E07B2A'
const ORANGE_DARK = '#C7661B'
const ORANGE_SOFT = '#FFF4E9'
const TEXT = '#4A433E'
const MUTED = '#857B72'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  section: string
}

const crmItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/crm/dashboard', section: 'GESTION' },
  { icon: Building2, label: 'Sociétés', path: '/crm/companies', section: 'GESTION' },
  { icon: KanbanSquare, label: 'Pipeline', path: '/crm/pipeline', section: 'ACTIVITÉ' },
  { icon: ClipboardList, label: 'Contrats', path: '/crm/contracts', section: 'ACTIVITÉ' },
  { icon: Settings, label: 'Paramètres', path: '/crm/settings', section: 'SYSTÈME' },
]

const rhItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/rh/dashboard', section: 'GESTION' },
  { icon: Users, label: 'Personnel', path: '/rh/personnel', section: 'GESTION' },
  { icon: Briefcase, label: 'Sous-traitants', path: '/rh/contractors', section: 'GESTION' },
  { icon: ClipboardList, label: 'Demandes Congés', path: '/rh/leave-requests', section: 'ACTIVITÉ' },
  { icon: House, label: 'Télétravail', path: '/rh/teletravail', section: 'ACTIVITÉ' },
  { icon: Workflow, label: 'Autorisations Sortie', path: '/rh/exit-authorizations', section: 'ACTIVITÉ' },
  { icon: CheckCircle2, label: 'Validations', path: '/rh/validations', section: 'ACTIVITÉ' },
  { icon: Calendar, label: 'Calendrier', path: '/rh/calendar', section: 'SUIVI' },
  { icon: Users, label: 'Equipes', path: '/rh/equipes', section: 'SUIVI' },
  { icon: Settings, label: 'Paramètres', path: '/rh/settings', section: 'SYSTÈME' },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { mode, toggleMode } = useThemeMode()
  const isDark = mode === 'dark'

  const initials = user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : '??'
  const fullName = user ? `${user.prenom} ${user.nom}` : ''
  const roleName = user?.role || ''
  const normalizedRole = normalizeRole(user?.role)

  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarOpen')
    return saved !== null ? saved === 'true' : true
  })

  const currentModule: 'crm' | 'rh' = location.pathname.startsWith('/crm') ? 'crm' : 'rh'
  const pageBg = isDark ? '#121210' : '#F8F7F5'
  const surfaceBg = isDark ? '#1A1A18' : '#FFFFFF'
  const borderColor = isDark ? '#2B2A28' : '#E8E1DA'
  const softHover = isDark ? '#242320' : '#F5F2EE'
  const textPrimary = isDark ? '#EFE8E1' : '#4A433E'
  const textMuted = isDark ? '#B8ADA3' : MUTED
  const sectionTitle = isDark ? '#958B83' : '#A0968D'
  const activeBg = isDark ? 'rgba(239,124,33,0.16)' : ORANGE_SOFT
  const searchBg = isDark ? '#1F1E1C' : '#FDFCFB'

  useEffect(() => {
    document.body.setAttribute('data-module', currentModule)
    return () => document.body.removeAttribute('data-module')
  }, [currentModule])

  const toggle = () => {
    setOpen((prev) => {
      localStorage.setItem('sidebarOpen', String(!prev))
      return !prev
    })
  }

  const switchModule = (moduleKey: 'crm' | 'rh') => {
    localStorage.setItem('selectedModule', moduleKey)
    navigate(`/${moduleKey}/dashboard`)
  }

  const handleLogout = () => {
    logout()
    navigate(currentModule === 'crm' ? '/crm/login' : '/rh/login')
  }

  const navItems = currentModule === 'crm' ? crmItems : rhItems
  const accessibleModules = (['crm', 'rh'] as const).filter((moduleKey) => canAccessModule(normalizedRole, moduleKey))
  const filteredNavItems = navItems.filter((item) => {
    if (currentModule === 'rh') return canAccessRhPath(normalizedRole, item.path)
    return canAccessModule(normalizedRole, 'crm')
  })

  useEffect(() => {
    const hasModuleAccess = canAccessModule(normalizedRole, currentModule)
    const hasPathAccess = currentModule === 'rh' ? canAccessRhPath(normalizedRole, location.pathname) : hasModuleAccess

    if (!hasModuleAccess || !hasPathAccess) {
      navigate(getDefaultPathForRole(normalizedRole), { replace: true })
    }
  }, [currentModule, location.pathname, navigate, normalizedRole])

  const currentNav = filteredNavItems.find(
    (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
  )

  const groupedItems = filteredNavItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {})

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: pageBg }}>
      <Drawer
        variant="permanent"
        sx={{
          width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : DRAWER_COLLAPSED,
            boxSizing: 'border-box',
            transition: 'width .2s ease',
            overflowX: 'hidden',
            bgcolor: surfaceBg,
            borderRight: `0.5px solid ${borderColor}`,
            boxShadow: 'none',
          },
        }}
      >
        <Box sx={{ p: 2.25, borderBottom: `0.5px solid ${borderColor}` }}>
          <Stack direction="row" alignItems="center" justifyContent={open ? 'space-between' : 'center'}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minHeight: 34 }}>
              <BrandLogo
                height={open ? 16 : 12}
                variant={open ? 'sidebar' : 'icon'}
                alt="Logo ITANIS"
                fallbackText={open ? 'ITANIS' : 'IT'}
              />
            </Stack>

            <IconButton size="small" onClick={toggle} sx={{ color: textMuted, '&:hover': { bgcolor: softHover } }}>
              {open ? <ChevronLeft size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />}
            </IconButton>
          </Stack>

          {open && accessibleModules.length > 1 && (
            <Stack direction="row" spacing={1} mt={2}>
              {accessibleModules.map((moduleKey) => (
                <Button
                  key={moduleKey}
                  fullWidth
                  onClick={() => switchModule(moduleKey)}
                  sx={{
                    minHeight: 30,
                    borderRadius: 999,
                    border: `1px solid ${borderColor}`,
                    textTransform: 'none',
                    fontSize: 12,
                    fontWeight: 500,
                    color: currentModule === moduleKey ? ORANGE : textMuted,
                    bgcolor: currentModule === moduleKey ? activeBg : surfaceBg,
                    '&:hover': { bgcolor: currentModule === moduleKey ? activeBg : softHover },
                  }}
                >
                  {moduleKey.toUpperCase()}
                </Button>
              ))}
            </Stack>
          )}
        </Box>

        <Box sx={{ flex: 1, px: 1.25, py: 1.75, overflowY: 'auto' }}>
          {Object.entries(groupedItems).map(([sectionName, items]) => (
            <Box key={sectionName} sx={{ mb: 1.5 }}>
              {open && (
                <Typography sx={{ px: 1.4, pb: 0.9, pt: 0.4, fontSize: 12, fontWeight: 500, color: sectionTitle, letterSpacing: '0.08em' }}>
                  {sectionName}
                </Typography>
              )}

              {items.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                const Icon = item.icon

                return (
                  <Tooltip key={item.path} title={!open ? item.label : ''} placement="right" arrow>
                    <Button
                      component={Link}
                      to={item.path}
                      fullWidth
                      sx={{
                        justifyContent: open ? 'flex-start' : 'center',
                        minHeight: 34,
                        borderRadius: 999,
                        px: open ? 1.35 : 0,
                        my: 0.35,
                        textTransform: 'none',
                        fontSize: 13,
                        fontWeight: 500,
                        color: isActive ? ORANGE : textMuted,
                        bgcolor: isActive ? activeBg : 'transparent',
                        '&:hover': { bgcolor: isActive ? activeBg : softHover, color: isActive ? ORANGE : textPrimary },
                      }}
                    >
                      <Icon size={16} strokeWidth={1.5} />
                      {open && <Typography sx={{ ml: 1.15, fontSize: 13, fontWeight: 500 }}>{item.label}</Typography>}
                    </Button>
                  </Tooltip>
                )
              })}
            </Box>
          ))}
        </Box>

        <Box sx={{ borderTop: `0.5px solid ${borderColor}`, p: 1.5 }}>
          <Stack direction={open ? 'row' : 'column'} spacing={1.2} alignItems="center">
            <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 600, bgcolor: '#ef7c21', color: '#ffffff' }}>
              {initials}
            </Avatar>
            {open && (
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: 13, color: textPrimary, fontWeight: 500 }}>
                  {fullName}
                </Typography>
                <Typography noWrap sx={{ fontSize: 11, color: textMuted }}>
                  {roleName}
                </Typography>
              </Box>
            )}
            <IconButton size="small" onClick={handleLogout} sx={{ color: textMuted, '&:hover': { color: '#E36556', bgcolor: isDark ? '#2A1D1A' : '#FAEFED' } }}>
              <LogOut size={16} strokeWidth={1.5} />
            </IconButton>
          </Stack>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: surfaceBg, borderBottom: `0.5px solid ${borderColor}` }}>
          <Toolbar sx={{ minHeight: '62px !important', px: { xs: 2, md: 3 }, justifyContent: 'space-between', gap: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, color: textMuted, letterSpacing: '0.07em', fontWeight: 500 }}>
                {currentModule.toUpperCase()}
              </Typography>
              <Typography sx={{ fontSize: 12, color: isDark ? '#6E645B' : '#C2B8AF' }}>/</Typography>
              <Typography noWrap sx={{ fontSize: 13, color: textPrimary, fontWeight: 500 }}>
                {currentNav?.label || 'Tableau de bord'}
              </Typography>
            </Stack>

            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                width: 'min(420px, 40%)',
                border: `1px solid ${borderColor}`,
                borderRadius: 999,
                px: 1.5,
                py: 0.5,
                bgcolor: searchBg,
              }}
            >
              <Search size={16} strokeWidth={1.5} color={textMuted} />
              <InputBase placeholder="Rechercher..." sx={{ ml: 1, fontSize: 13, color: textPrimary, width: '100%' }} />
            </Box>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton
                onClick={toggleMode}
                sx={{ color: textMuted, '&:hover': { bgcolor: softHover } }}
                aria-label="Changer le thème"
              >
                {isDark ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
              </IconButton>
              <IconButton sx={{ color: textMuted, '&:hover': { bgcolor: softHover } }}>
              <Bell size={16} strokeWidth={1.5} />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, maxWidth: 1600, width: '100%', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
