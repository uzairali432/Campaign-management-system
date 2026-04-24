import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { API_BASE_URL, fetchCampaigns } from '../lib/campaignApi'

const statusStyles = {
  pending_approval: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  draft: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
]

const formatStatusLabel = (status) => status.replace(/_/g, ' ')

const numberFormat = new Intl.NumberFormat('en-US')
const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const metricCards = [
  { key: 'impressions', label: 'Impressions', format: (v) => numberFormat.format(v) },
  { key: 'clicks', label: 'Clicks', format: (v) => numberFormat.format(v) },
  { key: 'ctr', label: 'CTR', format: (v) => `${v.toFixed(2)}%` },
  { key: 'conversions', label: 'Conversions', format: (v) => numberFormat.format(v) },
  { key: 'spend', label: 'Spend', format: (v) => currencyFormat.format(v) },
  { key: 'roas', label: 'ROAS', format: (v) => `${v.toFixed(2)}x` },
]

const columnDefs = [
  { key: 'name', label: 'Campaign' },
  { key: 'client', label: 'Client' },
  { key: 'status', label: 'Status' },
  { key: 'budget', label: 'Budget' },
  { key: 'spend', label: 'Spend' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'conversions', label: 'Conversions' },
  { key: 'ctr', label: 'CTR' },
  { key: 'roas', label: 'ROAS' },
]

const toNumber = (value) => Number(value || 0)

const normalizeDateKey = (value) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

const buildDateRange = (preset, customStart, customEnd) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (preset === 'custom') {
    const start = new Date(customStart)
    const end = new Date(customEnd)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { start: today, end: today, days: 1 }
    }

    const normalizedStart = start <= end ? start : end
    const normalizedEnd = start <= end ? end : start
    const dayDiff = Math.floor((normalizedEnd - normalizedStart) / (1000 * 60 * 60 * 24)) + 1

    return {
      start: normalizedStart,
      end: normalizedEnd,
      days: Math.max(dayDiff, 1),
    }
  }

  const presetDays = { '7d': 7, '30d': 30, '90d': 90 }[preset] || 30
  const start = new Date(today)
  start.setDate(today.getDate() - (presetDays - 1))

  return { start, end: today, days: presetDays }
}

const buildTrendData = (campaigns, startDate, endDate) => {
  const startKey = startDate.toISOString().slice(0, 10)
  const endKey = endDate.toISOString().slice(0, 10)
  const buckets = new Map()

  for (const campaign of campaigns) {
    const dateKey = normalizeDateKey(campaign.updatedAt || campaign.lastUpdated || campaign.createdAt)

    if (!dateKey || dateKey < startKey || dateKey > endKey) {
      continue
    }

    const bucket = buckets.get(dateKey) || {
      date: dateKey,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
    }

    bucket.impressions += toNumber(campaign.impressions)
    bucket.clicks += toNumber(campaign.clicks)
    bucket.conversions += toNumber(campaign.conversions)
    bucket.spend += toNumber(campaign.spend)
    bucket.revenue += toNumber(campaign.revenue)
    buckets.set(dateKey, bucket)
  }

  const result = []
  const cursor = new Date(startDate)

  while (cursor <= endDate) {
    const dateKey = cursor.toISOString().slice(0, 10)
    result.push(
      buckets.get(dateKey) || {
        date: dateKey,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      },
    )
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

function CampaignDashboard({ token, currentUser }) {
  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [selectedClient, setSelectedClient] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [selectedPreset, setSelectedPreset] = useState('30d')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [customStart, setCustomStart] = useState('2026-03-15')
  const [customEnd, setCustomEnd] = useState('2026-04-01')
  const [sortConfig, setSortConfig] = useState({ key: 'spend', direction: 'desc' })

  const loadCampaigns = useCallback(async () => {
    if (!token) {
      setCampaigns([])
      setLoadError('Your session expired. Please sign in again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError('')

    try {
      const response = await fetchCampaigns(token)

      setCampaigns(
        (response.campaigns || []).map((campaign) => ({
          ...campaign,
          id: campaign.id || campaign._id,
          budget: toNumber(campaign.budget),
          spend: toNumber(campaign.spend),
          impressions: toNumber(campaign.impressions),
          clicks: toNumber(campaign.clicks),
          conversions: toNumber(campaign.conversions),
          revenue: toNumber(campaign.revenue),
        })),
      )
    } catch (error) {
      setCampaigns([])
      setLoadError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Initial load
  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  // Real-time updates via Server-Sent Events.
  // EventSource (the browser SSE API) does not support custom request headers,
  // so the JWT is passed as a query parameter. This exposes it in server logs
  // and browser history; the trade-off is acceptable for this demo because the
  // token is already stored in localStorage and the server validates it on
  // every connection. A production system should use short-lived SSE tokens or
  // cookie-based auth instead.
  useEffect(() => {
    if (!token) return

    const url = `${API_BASE_URL}/api/events/campaigns?token=${encodeURIComponent(token)}`
    const source = new EventSource(url)

    source.addEventListener('connected', () => {
      setIsLive(true)
    })

    const handleCampaignEvent = () => {
      loadCampaigns()
    }

    source.addEventListener('campaign_created', handleCampaignEvent)
    source.addEventListener('campaign_updated', handleCampaignEvent)
    source.addEventListener('campaign_deleted', handleCampaignEvent)

    source.onerror = () => {
      setIsLive(false)
    }

    return () => {
      source.close()
      setIsLive(false)
    }
  }, [token, loadCampaigns])

  const clients = useMemo(
    () => ['all', ...new Set(campaigns.map((campaign) => campaign.client).filter(Boolean))],
    [campaigns],
  )

  const campaignList = useMemo(() => {
    const filteredByClient =
      selectedClient === 'all'
        ? campaigns
        : campaigns.filter((campaign) => campaign.client === selectedClient)

    return ['all', ...filteredByClient.map((campaign) => campaign.id)]
  }, [campaigns, selectedClient])

  const dateRange = useMemo(
    () => buildDateRange(selectedPreset, customStart, customEnd),
    [selectedPreset, customStart, customEnd],
  )

  const daysInPreset = dateRange.days

  const scopedCampaigns = useMemo(() => {
    return campaigns
      .filter((campaign) => selectedClient === 'all' || campaign.client === selectedClient)
      .filter((campaign) => selectedCampaign === 'all' || campaign.id === selectedCampaign)
  }, [campaigns, selectedClient, selectedCampaign])

  const trendData = useMemo(() => {
    return buildTrendData(scopedCampaigns, dateRange.start, dateRange.end)
  }, [scopedCampaigns, dateRange])

  const aggregateMetrics = useMemo(() => {
    const metrics = scopedCampaigns.reduce(
      (acc, campaign) => {
        acc.impressions += toNumber(campaign.impressions)
        acc.clicks += toNumber(campaign.clicks)
        acc.conversions += toNumber(campaign.conversions)
        acc.spend += toNumber(campaign.spend)
        acc.revenue += toNumber(campaign.revenue)
        return acc
      },
      { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 },
    )

    return {
      ...metrics,
      ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
      roas: metrics.spend > 0 ? metrics.revenue / metrics.spend : 0,
    }
  }, [scopedCampaigns])

  const dashboardSummary = useMemo(
    () => [
      { label: 'Clients in scope', value: selectedClient === 'all' ? clients.length - 1 : 1 },
      { label: 'Campaigns in scope', value: scopedCampaigns.length },
      { label: 'Reporting window', value: `${daysInPreset}d` },
    ],
    [clients.length, daysInPreset, scopedCampaigns.length, selectedClient],
  )

  const tableData = useMemo(() => {
    const searched = scopedCampaigns
      .map((campaign) => ({
        ...campaign,
        ctr: toNumber(campaign.impressions) > 0 ? (toNumber(campaign.clicks) / toNumber(campaign.impressions)) * 100 : 0,
        roas: toNumber(campaign.spend) > 0 ? toNumber(campaign.revenue) / toNumber(campaign.spend) : 0,
      }))
      .filter((campaign) => statusFilter === 'all' || campaign.status === statusFilter)
      .filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.client.toLowerCase().includes(searchTerm.toLowerCase()),
      )

    return [...searched].sort((a, b) => {
      const first = a[sortConfig.key]
      const second = b[sortConfig.key]

      if (typeof first === 'string') {
        const compare = first.localeCompare(second)
        return sortConfig.direction === 'asc' ? compare : -compare
      }

      const compare = first - second
      return sortConfig.direction === 'asc' ? compare : -compare
    })
  }, [scopedCampaigns, statusFilter, searchTerm, sortConfig])

  useEffect(() => {
    if (selectedClient !== 'all' && !clients.includes(selectedClient)) {
      setSelectedClient('all')
    }
  }, [clients, selectedClient])

  useEffect(() => {
    if (selectedCampaign !== 'all' && !campaignList.includes(selectedCampaign)) {
      setSelectedCampaign('all')
    }
  }, [campaignList, selectedCampaign])

  const toggleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
      <aside className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mb-5 rounded-[1.5rem] border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-4 dark:border-cyan-900/70 dark:from-cyan-950/40 dark:to-slate-950">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">Active window</p>
            <span
              title={isLive ? 'Real-time updates active' : 'Connecting…'}
              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold ${
                isLive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isLive ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`}
              />
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
          <p className="mt-2 font-display text-3xl font-semibold">{daysInPreset} days</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Live scope for KPIs and table data.</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {dashboardSummary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>

        <section className="mb-6">
          <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Clients</h2>
          <div className="space-y-2">
            {clients.map((client) => (
              <button
                key={client}
                type="button"
                onClick={() => {
                  setSelectedClient(client)
                  setSelectedCampaign('all')
                }}
                className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  selectedClient === client
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-600/20'
                    : 'bg-slate-100 text-slate-700 hover:-translate-y-0.5 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {client === 'all' ? 'All Clients' : client}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Campaigns</h2>
          <div className="space-y-2">
            {campaignList.map((campaignId) => {
              const label =
                campaignId === 'all'
                  ? 'All Campaigns'
                  : campaigns.find((campaign) => campaign.id === campaignId)?.name || campaignId

              return (
                <button
                  key={campaignId}
                  type="button"
                  onClick={() => setSelectedCampaign(campaignId)}
                  className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    selectedCampaign === campaignId
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-600/20'
                      : 'bg-slate-100 text-slate-700 hover:-translate-y-0.5 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Access</h2>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-slate-700 dark:text-slate-200">Signed in as {currentUser?.name || 'User'}</p>
            <p className="capitalize text-slate-600 dark:text-slate-300">Role: {currentUser?.role || 'viewer'}</p>
            {currentUser?.role === 'viewer' && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Viewer mode is read-only. Campaign edits and deletions are restricted by backend policy.
              </p>
            )}
          </div>
        </section>
      </aside>

      <div className="space-y-4">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
          {loadError && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-100 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/40 dark:text-amber-200">
              {loadError}
            </div>
          )}

          {isLoading && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading live campaigns...
            </div>
          )}

          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Date range</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: '7d', label: 'Last 7d' },
                  { id: '30d', label: 'Last 30d' },
                  { id: '90d', label: 'Last 90d' },
                  { id: 'custom', label: 'Custom' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      selectedPreset === preset.id
                        ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {selectedPreset === 'custom' && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Status filter</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Search campaigns</label>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by campaign or client"
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {metricCards.map((metric) => (
              <article
                key={metric.key}
                className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">{metric.format(aggregateMetrics[metric.key])}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Trend view</p>
              <h2 className="font-display text-lg font-semibold">Performance trend</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Comparing impressions, clicks, conversions, spend, and revenue.</p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Spend') return [currencyFormat.format(value), name]
                    if (name === 'Revenue') return [currencyFormat.format(value), name]
                    return [numberFormat.format(value), name]
                  }}
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                  }}
                />
                <Line type="monotone" dataKey="impressions" stroke="#0ea5e9" strokeWidth={2.4} dot={false} name="Impressions" />
                <Line type="monotone" dataKey="clicks" stroke="#f97316" strokeWidth={2.4} dot={false} name="Clicks" />
                <Line type="monotone" dataKey="conversions" stroke="#14b8a6" strokeWidth={2.4} dot={false} name="Conversions" />
                <Line type="monotone" dataKey="spend" stroke="#a855f7" strokeWidth={2.4} dot={false} name="Spend" />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.4} dot={false} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100/90 dark:bg-slate-900">
                <tr>
                  {columnDefs.map((column) => (
                    <th key={column.key} className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="font-semibold text-slate-700 transition hover:text-cyan-700 dark:text-slate-200 dark:hover:text-cyan-300"
                      >
                        {column.label}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-t border-slate-200 transition hover:bg-cyan-50/60 dark:border-slate-800 dark:hover:bg-cyan-950/20"
                  >
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">{campaign.name}</td>
                    <td className="px-4 py-3">{campaign.client}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[campaign.status] || statusStyles.draft}`}>
                        {formatStatusLabel(campaign.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{currencyFormat.format(campaign.budget)}</td>
                    <td className="px-4 py-3">{currencyFormat.format(campaign.spend)}</td>
                    <td className="px-4 py-3">{numberFormat.format(campaign.impressions)}</td>
                    <td className="px-4 py-3">{numberFormat.format(campaign.clicks)}</td>
                    <td className="px-4 py-3">{numberFormat.format(campaign.conversions)}</td>
                    <td className="px-4 py-3">{campaign.ctr.toFixed(2)}%</td>
                    <td className="px-4 py-3">{campaign.roas.toFixed(2)}x</td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={columnDefs.length} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      No campaigns match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CampaignDashboard
