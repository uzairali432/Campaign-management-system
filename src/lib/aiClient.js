const creativeSchemaPrompt = `You are a senior creative director for an advertising agency.
Return a strict JSON object with this exact shape:
{
  "campaignTitle": "string",
  "headlineOptions": ["string", "string", "string"],
  "toneGuide": "string",
  "recommendedChannels": [
    { "channel": "string", "allocation": number, "rationale": "string" }
  ],
  "keyVisualDirection": "string"
}
No markdown. No extra keys.`

function normalizeAiJson(rawText) {
  const withoutFence = rawText.replace(/```json|```/gi, '').trim()

  try {
    return JSON.parse(withoutFence)
  } catch {
    const fallback = withoutFence.match(/\{[\s\S]*\}/)
    if (!fallback) {
      throw new Error('AI response could not be parsed as JSON.')
    }

    return JSON.parse(fallback[0])
  }
}

export async function requestCreativeDirection({ provider, apiKey, model, payload }) {
  if (!apiKey) {
    throw new Error('Missing API key. Add one in review step to call AI API.')
  }

  const userPrompt = `Create a campaign direction from this brief:\n${JSON.stringify(payload, null, 2)}`

  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: creativeSchemaPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI request failed: ${errorText}`)
    }

    const result = await response.json()
    const rawText = result.choices?.[0]?.message?.content || ''
    return normalizeAiJson(rawText)
  }

  if (provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        temperature: 0.7,
        system: creativeSchemaPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic request failed: ${errorText}`)
    }

    const result = await response.json()
    const rawText = result.content?.[0]?.text || ''
    return normalizeAiJson(rawText)
  }

  throw new Error('Unsupported provider selected.')
}

export function fallbackCreativeDirection(payload) {
  const objectiveLabel = payload.objective || 'awareness'
  const primaryColor = payload.colorDirection || 'high-contrast fresh tones'

  return {
    campaignTitle: `${payload.clientName || 'Client'}: ${objectiveLabel} Momentum`,
    headlineOptions: [
      `Own the moment with ${payload.clientName || 'your brand'}`,
      `Make every impression unforgettable`,
      `From scroll to action in one story arc`,
    ],
    toneGuide:
      payload.tone ||
      'Confident, human, and clear. Keep language energetic with concise benefit-led statements.',
    recommendedChannels: [
      { channel: 'Paid Social', allocation: 40, rationale: 'Fast reach and audience experimentation.' },
      { channel: 'Search', allocation: 30, rationale: 'Intent capture for lower-funnel demand.' },
      { channel: 'Programmatic Display', allocation: 20, rationale: 'Scale with contextual audience segments.' },
      { channel: 'Influencer Partnerships', allocation: 10, rationale: 'Social proof and creative amplification.' },
    ],
    keyVisualDirection: `Hero visual uses ${primaryColor} with a single dominant subject in motion, shot in a cinematic wide frame. Layer subtle product cues and concise copy overlays focused on ${objectiveLabel}.`,
  }
}
