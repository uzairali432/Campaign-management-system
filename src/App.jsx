import { useEffect, useState } from 'react'
import CampaignDashboard from './components/CampaignDashboard'
import CreativeBriefBuilder from './components/CreativeBriefBuilder'

const viewOptions = [
  {
    id: 'dashboard',
    label: 'Campaign Dashboard',
    description: 'Performance insights, filters, and campaign table',
  },
  {
    id: 'brief',
    label: 'Creative Brief Builder',
    description: 'AI-assisted strategy and creative direction output',
  },
]

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('ads-dashboard-theme')
    return stored ? stored === 'dark' : false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('ads-dashboard-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

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
                <span>Unified media and creative workspace</span>
              </div>
              <div className="max-w-3xl space-y-3">
                <h1 className="font-display text-3xl font-semibold leading-tight md:text-5xl">
                  Campaign Command Center
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
                  Track campaign performance, tune filters, and generate production-ready creative direction from one workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-slate-800 dark:bg-slate-900/80">
                  Live campaign metrics
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-slate-800 dark:bg-slate-900/80">
                  Creative brief export
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-slate-800 dark:bg-slate-900/80">
                  Responsive dashboard layout
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
                onClick={() => setIsDarkMode((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-700 dark:hover:bg-slate-800"
              >
                {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 md:grid-cols-2">
            {viewOptions.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
                className={`group rounded-3xl border p-4 text-left transition duration-200 ${
                  activeView === view.id
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25'
                    : 'border-slate-200 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-900'
                }`}
              >
                <p className="font-display text-base font-semibold">{view.label}</p>
                <p className={`mt-1 text-xs leading-5 ${activeView === view.id ? 'text-cyan-50' : 'text-slate-500 dark:text-slate-400'}`}>
                  {view.description}
                </p>
                <div className={`mt-4 h-1.5 w-16 rounded-full ${activeView === view.id ? 'bg-white/70' : 'bg-cyan-500/20 group-hover:bg-cyan-500/40'}`} />
              </button>
            ))}
          </div>
        </header>

        <main>
          {activeView === 'dashboard' ? <CampaignDashboard /> : <CreativeBriefBuilder />}
        </main>
      </div>
    </div>
  )
}

export default App
