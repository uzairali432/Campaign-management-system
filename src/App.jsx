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
      <div className="mx-auto max-w-[1680px] px-4 pb-8 pt-6 md:px-6 lg:px-8">
        <header className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-5 shadow-panel backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80 md:p-7">
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-400/20" />
          <div className="pointer-events-none absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-orange-300/25 blur-3xl dark:bg-amber-400/20" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="font-display text-xs uppercase tracking-[0.35em] text-cyan-700 dark:text-cyan-300">
                Ad Operations Suite
              </p>
              <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
                Campaign Command Center
              </h1>
              <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Monitor live campaign performance and generate production-ready creative direction from one workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>

          <div className="relative mt-5 grid gap-2 md:grid-cols-2">
            {viewOptions.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveView(view.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  activeView === view.id
                    ? 'border-cyan-500 bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'border-slate-200 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-cyan-700'
                }`}
              >
                <p className="font-display text-base font-semibold">{view.label}</p>
                <p className={`mt-1 text-xs ${activeView === view.id ? 'text-cyan-50' : 'text-slate-500 dark:text-slate-400'}`}>
                  {view.description}
                </p>
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
