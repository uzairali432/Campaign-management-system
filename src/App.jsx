import { useEffect, useState } from 'react'
import CampaignDashboard from './components/CampaignDashboard'
import CreativeBriefBuilder from './components/CreativeBriefBuilder'

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
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-[1680px] p-4 md:p-6 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
              Ad Operations Suite
            </p>
            <h1 className="font-display text-2xl font-semibold md:text-3xl">Campaign Command Center</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeView === 'dashboard'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Campaign Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveView('brief')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeView === 'brief'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Creative Brief Builder
            </button>

            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </header>

        <main>
          {activeView === 'dashboard' ? (
            <CampaignDashboard isDarkMode={isDarkMode} />
          ) : (
            <CreativeBriefBuilder />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
