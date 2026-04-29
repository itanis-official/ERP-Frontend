import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

export type AppThemeMode = 'light' | 'dark'

type ThemeModeContextValue = {
  mode: AppThemeMode
  setMode: (mode: AppThemeMode) => void
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)

function getInitialMode(): AppThemeMode {
  const saved = localStorage.getItem('themeMode')
  if (saved === 'light' || saved === 'dark') return saved

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>(getInitialMode)

  useEffect(() => {
    localStorage.setItem('themeMode', mode)
    document.documentElement.setAttribute('data-theme', mode)
    document.documentElement.style.colorScheme = mode
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  )

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeModeProvider')
  }
  return context
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode()

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#ef7c21', dark: '#d96813', light: '#fff3e8' },
          secondary: { main: mode === 'dark' ? '#c9bdb2' : '#6e655e' },
          divider: mode === 'dark' ? '#2b2a28' : '#e7d8ca',
          background:
            mode === 'dark'
              ? { default: '#121210', paper: '#1a1a18' }
              : { default: '#fffaf5', paper: '#ffffff' },
          text:
            mode === 'dark'
              ? { primary: '#f3ede7', secondary: '#b8ada3' }
              : { primary: '#1d1d1b', secondary: '#6e655e' },
        },
        typography: {
          fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif",
          fontSize: 16,
          button: { textTransform: 'none', fontWeight: 500 },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                border: `1px solid ${mode === 'dark' ? '#2b2a28' : '#ecded1'}`,
                boxShadow: mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.28)' : '0 8px 24px rgba(29,29,27,0.06)',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${mode === 'dark' ? '#2b2a28' : '#efe3d8'}`,
              },
              head: {
                backgroundColor: mode === 'dark' ? '#201f1d' : '#f8f3ed',
                color: mode === 'dark' ? '#d9cec4' : '#5d554f',
                fontWeight: 600,
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(239,124,33,0.08)' : 'rgba(239,124,33,0.06)',
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#1f1e1c' : '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? '#353330' : '#e7d8ca',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? '#4a4540' : '#d7c5b6',
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              indicator: {
                backgroundColor: '#ef7c21',
              },
            },
          },
        },
      }),
    [mode],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
