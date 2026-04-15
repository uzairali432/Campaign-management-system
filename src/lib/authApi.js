const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const parseJson = async (response) => response.json().catch(() => ({}))

const toError = (payload, fallbackMessage) =>
  new Error(payload.message || payload.error || fallbackMessage)

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw toError(payload, 'Login failed.')
  }

  return payload
}

export async function registerUser(input) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw toError(payload, 'Registration failed.')
  }

  return payload
}

export async function fetchCurrentUser(token) {
  if (!token) {
    throw new Error('Not authenticated.')
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    throw toError(payload, 'Unable to fetch current user.')
  }

  return payload.user
}
