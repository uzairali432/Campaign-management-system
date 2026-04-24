import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AssetManager from './components/AssetManager'
import AuthScreen from './components/AuthScreen'
import CampaignDashboard from './components/CampaignDashboard'
import CreativeBriefBuilder from './components/CreativeBriefBuilder'
import { fetchCurrentUser, loginUser, registerUser } from './lib/authApi'

const authTokenStorageKey = 'ads-auth-token'

const routeOptions = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Campaign Dashboard',
    description: 'Performance insights, filters, and campaign table',
  },
  {
    id: 'assets',
    path: '/assets',
    label: 'Asset Manager',
    description: 'Centralized storage for campaign images and documents',
  },
  {
    id: 'brief',
    path: '/brief',
    label: 'Creative Brief Builder',
    description: 'AI-assisted strategy and creative direction output',
    allowedRoles: ['admin', 'manager'],
  },
]

function ProtectedRoute({ isAuthenticated, userRole, allowedRoles }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

function AuthenticatedLayout({
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onLogout,
}) {
  const allowedRoutes = useMemo(
    () =>
      routeOptions.filter(
        (route) => !route.allowedRoles || route.allowedRoles.includes(currentUser?.role),
      ),
    [currentUser?.role],
  )

  return (
    <div className="min-h-screen text-slate-900 transition-colors duration-300 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute right-0 top-36 h-96 w-96 rounded-full bg-orange-300/15 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl dark:bg-indigo-500/10" />
      </div>

      <div className="relative mx-auto max-w-[1680px] px-4 pb-8 pt-6 md:px-6 lg:px-8">
        <header className="relative mb-6 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-5 shadow-panel backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70 md:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/15" />
          <div className="pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl dark:bg-amber-400/15" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-300">
                  Ad Operations Suite
                </span>
                <span>Authenticated workspace</span>
              </div>
              <div className="max-w-3xl space-y-3">
                <h1 className="font-display text-3xl font-semibold leading-tight md:text-5xl">
                  Campaign Command Center
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                  Track campaign performance, collaborate across teams, and generate creative direction with role-aware access controls.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-slate-800 dark:bg-slate-900/80">
                  Signed in as {currentUser?.name || 'User'}
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 capitalize dark:border-slate-800 dark:bg-slate-900/80">
                  Role: {currentUser?.role || 'viewer'}
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-slate-800 dark:bg-slate-900/80">
                  JWT-protected routes
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
              <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Theme
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {isDarkMode ? 'Dark mode enabled' : 'Light mode enabled'}
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleDarkMode}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-700 dark:hover:bg-slate-800"
              >
                {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 md:grid-cols-2">
            {allowedRoutes.map((view) => (
              <NavLink
                key={view.id}
                to={view.path}
                className={({ isActive }) =>
                  `group rounded-3xl border p-4 text-left transition duration-200 ${
                    isActive
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'border-slate-200 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <p className="font-display text-base font-semibold">{view.label}</p>
                    <p className={`mt-1 text-xs leading-5 ${isActive ? 'text-cyan-50' : 'text-slate-500 dark:text-slate-400'}`}>
                      {view.description}
                    </p>
                    <div className={`mt-4 h-1.5 w-16 rounded-full ${isActive ? 'bg-white/70' : 'bg-cyan-500/20 group-hover:bg-cyan-500/40'}`} />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('ads-dashboard-theme')
    return stored ? stored === 'dark' : false
  })
  const [token, setToken] = useState(() => localStorage.getItem(authTokenStorageKey) || '')
  const [currentUser, setCurrentUser] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  const isAuthenticated = Boolean(token && currentUser)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('ads-dashboard-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  useEffect(() => {
    let isActive = true

    const bootstrapAuth = async () => {
      if (!token) {
        if (isActive) {
          setCurrentUser(null)
          setIsBootstrapping(false)
        }
        return
      }

      try {
        const user = await fetchCurrentUser(token)
        if (isActive) {
          setCurrentUser(user)
        }
      } catch {
        if (isActive) {
          localStorage.removeItem(authTokenStorageKey)
          setToken('')
          setCurrentUser(null)
        }
      } finally {
        if (isActive) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrapAuth()

    return () => {
      isActive = false
    }
  }, [token])

  const handleAuthSuccess = ({ token: nextToken, user }) => {
    localStorage.setItem(authTokenStorageKey, nextToken)
    setToken(nextToken)
    setCurrentUser(user)
    setAuthError('')
  }

  const handleLogin = async (payload) => {
    setIsSubmitting(true)
    setAuthError('')

    try {
      const response = await loginUser(payload)
      handleAuthSuccess(response)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (payload) => {
    setIsSubmitting(true)
    setAuthError('')

    try {
      const response = await registerUser(payload)
      handleAuthSuccess(response)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(authTokenStorageKey)
    setToken('')
    setCurrentUser(null)
    setAuthError('')
  }

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-slate-300">
        Restoring authenticated session...
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthScreen
              mode="login"
              isSubmitting={isSubmitting}
              error={authError}
              onSubmit={handleLogin}
            />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthScreen
              mode="register"
              isSubmitting={isSubmitting}
              error={authError}
              onSubmit={handleRegister}
            />
          )
        }
      />

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser?.role} />}>
        <Route
          element={
            <AuthenticatedLayout
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          }
        >
          <Route path="/dashboard" element={<CampaignDashboard token={token} currentUser={currentUser} />} />
          <Route path="/assets" element={<AssetManager token={token} currentUser={currentUser} />} />
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} userRole={currentUser?.role} allowedRoles={['admin', 'manager']} />}>
            <Route path="/brief" element={<CreativeBriefBuilder currentUser={currentUser} />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route
        path="*"
        element={
          <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
            <h2 className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">Route not found</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              The page you requested does not exist.
            </p>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="mt-5 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Return to app
            </Link>
          </div>
        }
      />
    </Routes>
  )
}

export default App
