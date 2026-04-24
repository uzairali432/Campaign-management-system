const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export { API_BASE_URL }

export async function fetchCampaigns(token) {
  if (!token) {
    throw new Error('Add a JWT access token to load live campaigns from the API.')
  }

  const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Failed to load campaigns from the API.')
  }

  return payload
}

export async function fetchCampaignAssets(token, campaignId) {
  if (!token) {
    throw new Error('Not authenticated.')
  }

  const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/assets`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Failed to load assets.')
  }

  return payload.assets
}

export async function uploadCampaignAsset(token, campaignId, file) {
  if (!token) {
    throw new Error('Not authenticated.')
  }

  const body = new FormData()
  body.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/assets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Upload failed.')
  }

  return payload.asset
}

export async function deleteCampaignAsset(token, campaignId, assetId) {
  if (!token) {
    throw new Error('Not authenticated.')
  }

  const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/assets/${assetId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Delete failed.')
  }

  return payload
}
