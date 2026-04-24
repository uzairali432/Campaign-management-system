import { useCallback, useEffect, useRef, useState } from 'react'
import {
  API_BASE_URL,
  deleteCampaignAsset,
  fetchCampaignAssets,
  fetchCampaigns,
  uploadCampaignAsset,
} from '../lib/campaignApi'

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.doc,.docx'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isImage = (mimeType) => mimeType.startsWith('image/')

function AssetManager({ token, currentUser }) {
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [assets, setAssets] = useState([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const fileInputRef = useRef(null)

  const isViewer = currentUser?.role === 'viewer'

  // Load campaigns for the selector
  useEffect(() => {
    if (!token) return

    let isActive = true
    setIsLoadingCampaigns(true)
    setError('')

    fetchCampaigns(token)
      .then((data) => {
        if (isActive) {
          setCampaigns(data.campaigns || [])
        }
      })
      .catch((err) => {
        if (isActive) setError(err.message)
      })
      .finally(() => {
        if (isActive) setIsLoadingCampaigns(false)
      })

    return () => {
      isActive = false
    }
  }, [token])

  // Load assets when a campaign is selected
  const loadAssets = useCallback(
    async (campaignId) => {
      if (!campaignId || !token) {
        setAssets([])
        return
      }

      setIsLoadingAssets(true)
      setError('')

      try {
        const data = await fetchCampaignAssets(token, campaignId)
        setAssets(data || [])
      } catch (err) {
        setError(err.message)
        setAssets([])
      } finally {
        setIsLoadingAssets(false)
      }
    },
    [token],
  )

  useEffect(() => {
    loadAssets(selectedCampaignId)
  }, [selectedCampaignId, loadAssets])

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]

    if (!file) return

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${formatBytes(MAX_SIZE_BYTES)}.`)
      event.target.value = ''
      return
    }

    if (!selectedCampaignId) {
      setError('Please select a campaign before uploading.')
      event.target.value = ''
      return
    }

    setError('')
    setIsUploading(true)

    try {
      await uploadCampaignAsset(token, selectedCampaignId, file)
      await loadAssets(selectedCampaignId)
      showSuccess(`"${file.name}" uploaded successfully.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleDelete = async (assetId, originalName) => {
    if (!window.confirm(`Delete "${originalName}"? This cannot be undone.`)) return

    setDeletingId(assetId)
    setError('')

    try {
      await deleteCampaignAsset(token, selectedCampaignId, assetId)
      setAssets((current) => current.filter((asset) => asset._id !== assetId))
      showSuccess(`"${originalName}" deleted.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const selectedCampaign = campaigns.find(
    (campaign) => (campaign._id || campaign.id) === selectedCampaignId,
  )

  return (
    <div className="space-y-5">
      {/* Header card */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Asset Management
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
              Campaign Assets
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Centralized storage for campaign images and documents. Accepted: images, PDF, Word
              (max&nbsp;5&nbsp;MB).
            </p>
          </div>

          {!isViewer && (
            <button
              type="button"
              disabled={!selectedCampaignId || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? 'Uploading…' : '+ Upload File'}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Campaign selector */}
        <div className="max-w-sm">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Campaign
          </label>
          {isLoadingCampaigns ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading campaigns…</p>
          ) : (
            <select
              value={selectedCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">— Select a campaign —</option>
              {campaigns.map((campaign) => (
                <option key={campaign._id || campaign.id} value={campaign._id || campaign.id}>
                  {campaign.name} ({campaign.client})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Inline feedback */}
        {error && (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-100 px-4 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/40 dark:text-amber-200">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/40 dark:text-emerald-200">
            {successMessage}
          </p>
        )}
      </section>

      {/* Asset list */}
      {selectedCampaignId && (
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Assets for{' '}
            <span className="text-slate-900 dark:text-slate-100">
              {selectedCampaign?.name || selectedCampaignId}
            </span>
          </p>

          {isLoadingAssets ? (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading assets…
            </p>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No assets yet for this campaign.
              </p>
              {!isViewer && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-cyan-300 px-4 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-700 dark:text-cyan-300 dark:hover:bg-cyan-950/40"
                >
                  Upload the first asset
                </button>
              )}
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => {
                // Validate that the stored filename contains only safe characters
                // (multer generates names as "<timestamp>-<random>.<ext>") before
                // embedding it in a URL to prevent open-redirect or XSS via a
                // tampered database value.
                const safeFilename = /^[\w.-]+$/.test(asset.filename) ? asset.filename : ''
                const assetUrl = safeFilename ? `${API_BASE_URL}/uploads/${safeFilename}` : ''
                const isImg = isImage(asset.mimeType)

                return (
                  <li
                    key={asset._id}
                    className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    {/* Thumbnail */}
                    <div className="flex h-36 items-center justify-center bg-slate-100 dark:bg-slate-800">
                      {isImg && assetUrl ? (
                        <img
                          src={assetUrl}
                          alt={asset.originalName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">
                          {asset.mimeType === 'application/pdf' ? '📄' : '📝'}
                        </span>
                      )}
                    </div>

                    {/* Info row */}
                    <div className="flex flex-1 items-start justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {asset.originalName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatBytes(asset.size)} ·{' '}
                          {new Date(asset.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          by {asset.uploadedBy?.name || 'unknown'}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1.5">
                        {assetUrl && (
                          <a
                            href={assetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            View
                          </a>
                        )}
                        {!isViewer && (
                          <button
                            type="button"
                            disabled={deletingId === asset._id}
                            onClick={() => handleDelete(asset._id, asset.originalName)}
                            className="rounded-xl border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                          >
                            {deletingId === asset._id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

export default AssetManager
