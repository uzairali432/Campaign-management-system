import { useState } from 'react'
import { Link } from 'react-router-dom'

const roleOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'admin', label: 'Admin' },
]

function AuthScreen({ mode, isSubmitting, error, onSubmit }) {
  const isRegister = mode === 'register'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager',
  })

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = isRegister
      ? {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        }
      : {
          email: form.email.trim(),
          password: form.password,
        }

    await onSubmit(payload)
  }

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-16 top-8 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute right-0 top-28 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl dark:bg-amber-500/12" />
      </div>

      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-panel backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70 md:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <section className="space-y-4">
            <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-300">
              Ad Operations Suite
            </span>
            <h1 className="font-display text-3xl font-semibold leading-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              {isRegister ? 'Create your workspace account' : 'Sign in to your command center'}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
              Access live campaign analytics, role-based controls, and collaborative creative workflows with a secured JWT session.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Roles</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Admin, Manager, Viewer</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Auth</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">JWT Protected Routes</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Session</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Persistent Login</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {isRegister ? 'Register' : 'Login'}
            </p>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              {isRegister && (
                <input
                  required
                  value={form.name}
                  onChange={updateField('name')}
                  placeholder="Full name"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950"
                />
              )}

              <input
                required
                type="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="Email"
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950"
              />

              <input
                required
                minLength={6}
                type="password"
                value={form.password}
                onChange={updateField('password')}
                placeholder="Password"
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950"
              />

              {isRegister && (
                <select
                  value={form.role}
                  onChange={updateField('role')}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {error && (
                <p className="rounded-2xl border border-amber-200 bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/40 dark:text-amber-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-60"
              >
                {isSubmitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
              <Link
                to={isRegister ? '/login' : '/register'}
                className="font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300 dark:hover:text-cyan-200"
              >
                {isRegister ? 'Sign in here' : 'Register here'}
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AuthScreen
