const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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
