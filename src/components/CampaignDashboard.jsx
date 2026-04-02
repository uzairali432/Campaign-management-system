import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import data from '../data/mockData.json'

const statusStyles = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  completed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  draft: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

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

function CampaignDashboard() {
  const [selectedClient, setSelectedClient] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [selectedPreset, setSelectedPreset] = useState('30d')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [customStart, setCustomStart] = useState('2026-03-15')
  const [customEnd, setCustomEnd] = useState('2026-04-01')
  const [sortConfig, setSortConfig] = useState({ key: 'spend', direction: 'desc' })

  const clients = useMemo(
    () => ['all', ...new Set(data.campaigns.map((campaign) => campaign.client))],
    [],
  )

  const campaignList = useMemo(() => {
    const filteredByClient =
      selectedClient === 'all'
        ? data.campaigns
        : data.campaigns.filter((campaign) => campaign.client === selectedClient)

    return ['all', ...filteredByClient.map((campaign) => campaign.id)]
  }, [selectedClient])

  const daysInPreset = useMemo(() => {
    if (selectedPreset === 'custom') {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      const dayDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
      return dayDiff > 0 ? dayDiff : 1
    }

    const preset = data.datePresets.find((item) => item.id === selectedPreset)
    return preset?.days ?? 30
  }, [selectedPreset, customStart, customEnd])

  const scopedCampaigns = useMemo(() => {
    const rangeFactor = Math.min(daysInPreset / 90, 1)

    return data.campaigns
      .filter((campaign) => selectedClient === 'all' || campaign.client === selectedClient)
      .filter((campaign) => selectedCampaign === 'all' || campaign.id === selectedCampaign)
      .map((campaign) => ({
        ...campaign,
        spend: Math.round(campaign.spend * rangeFactor),
        impressions: Math.round(campaign.impressions * rangeFactor),
        clicks: Math.round(campaign.clicks * rangeFactor),
        conversions: Math.round(campaign.conversions * rangeFactor),
        revenue: Math.round(campaign.revenue * rangeFactor),
      }))
  }, [selectedClient, selectedCampaign, daysInPreset])

  const trendData = useMemo(() => {
    if (selectedPreset === 'custom') {
      return data.trend.filter((point) => point.date >= customStart && point.date <= customEnd)
    }

    const days = data.datePresets.find((item) => item.id === selectedPreset)?.days ?? 30
    return data.trend.slice(-days)
  }, [selectedPreset, customStart, customEnd])

  const aggregateMetrics = useMemo(() => {
    const metrics = scopedCampaigns.reduce(
      (acc, campaign) => {
        acc.impressions += campaign.impressions
        acc.clicks += campaign.clicks
        acc.conversions += campaign.conversions
        acc.spend += campaign.spend
        acc.revenue += campaign.revenue
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

  const tableData = useMemo(() => {
    const searched = scopedCampaigns
      .map((campaign) => ({
        ...campaign,
        ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
        roas: campaign.spend > 0 ? campaign.revenue / campaign.spend : 0,
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

  const toggleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
        <section className="mb-6">
          <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-slate-500">Clients</h2>
          <div className="space-y-2">
            {clients.map((client) => (
              <button
                key={client}
                type="button"
                onClick={() => {
                  setSelectedClient(client)
                  setSelectedCampaign('all')
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  selectedClient === client
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {client === 'all' ? 'All Clients' : client}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-slate-500">Campaigns</h2>
          <div className="space-y-2">
            {campaignList.map((campaignId) => {
              const label =
                campaignId === 'all'
                  ? 'All Campaigns'
                  : data.campaigns.find((campaign) => campaign.id === campaignId)?.name

              return (
                <button
                  key={campaignId}
                  type="button"
                  onClick={() => setSelectedCampaign(campaignId)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    selectedCampaign === campaignId
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-sm uppercase tracking-[0.2em] text-slate-500">Settings</h2>
          <ul className="space-y-2">
            {data.sidebar.settings.map((setting) => (
              <li
                key={setting}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {setting}
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Date range</label>
              <div className="flex flex-wrap gap-2">
                {data.datePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedPreset === preset.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
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
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status filter</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Search campaigns</label>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by campaign or client"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {metricCards.map((metric) => (
              <article
                key={metric.key}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
                <p className="mt-2 font-display text-2xl font-semibold">{metric.format(aggregateMetrics[metric.key])}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 font-display text-lg font-semibold">30-Day Performance Trend</h2>
          <div className="h-[320px] w-full">
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Spend') return [currencyFormat.format(value), name]
                    if (name === 'ROAS Revenue') return [currencyFormat.format(value), name]
                    return [numberFormat.format(value), name]
                  }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                  }}
                />
                <Line type="monotone" dataKey="impressions" stroke="#0ea5e9" strokeWidth={2.4} dot={false} name="Impressions" />
                <Line type="monotone" dataKey="clicks" stroke="#f97316" strokeWidth={2.4} dot={false} name="Clicks" />
                <Line type="monotone" dataKey="conversions" stroke="#14b8a6" strokeWidth={2.4} dot={false} name="Conversions" />
                <Line type="monotone" dataKey="spend" stroke="#a855f7" strokeWidth={2.4} dot={false} name="Spend" />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.4} dot={false} name="ROAS Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-950">
                <tr>
                  {columnDefs.map((column) => (
                    <th key={column.key} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {column.label}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((campaign) => (
                  <tr key={campaign.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-3 font-semibold">{campaign.name}</td>
                    <td className="px-4 py-3">{campaign.client}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusStyles[campaign.status]}`}>
                        {campaign.status}
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
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CampaignDashboard
