import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { fallbackCreativeDirection, requestCreativeDirection } from '../lib/aiClient'

const objectives = ['awareness', 'consideration', 'conversion']

const initialForm = {
  clientName: '',
  industry: '',
  website: '',
  competitors: '',
  objective: 'awareness',
  targetAudience: '',
  budget: '',
  tone: '',
  imageryStyle: '',
  colorDirection: '',
  dosAndDonts: '',
}

function CreativeBriefBuilder() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-4o-mini')
  const [apiKey, setApiKey] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [output, setOutput] = useState(null)
  const [error, setError] = useState('')
  const outputRef = useRef(null)

  const summaryItems = useMemo(
    () => [
      { label: 'Client', value: form.clientName },
      { label: 'Industry', value: form.industry },
      { label: 'Website', value: form.website },
      { label: 'Competitors', value: form.competitors },
      { label: 'Objective', value: form.objective },
      { label: 'Target Audience', value: form.targetAudience },
      { label: 'Budget', value: form.budget },
      { label: 'Tone', value: form.tone },
      { label: 'Imagery', value: form.imageryStyle },
      { label: 'Color Direction', value: form.colorDirection },
      { label: "Do's & Don'ts", value: form.dosAndDonts },
    ],
    [form],
  )

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const nextStep = () => setStep((current) => Math.min(4, current + 1))
  const prevStep = () => setStep((current) => Math.max(1, current - 1))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const result = await requestCreativeDirection({
        provider,
        model,
        apiKey,
        payload: form,
      })
      setOutput(result)
    } catch (requestError) {
      const fallback = fallbackCreativeDirection(form)
      setOutput(fallback)
      setError(`${requestError.message} Showing offline fallback output.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const exportPdf = async () => {
    if (!outputRef.current) {
      return
    }

    const canvas = await html2canvas(outputRef.current, { scale: 2, backgroundColor: '#ffffff' })
    const imageData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    const pageWidth = 210
    const pageHeight = (canvas.height * pageWidth) / canvas.width

    pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight)
    pdf.save('creative-direction.pdf')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Step {step} of 4</p>
          <h2 className="font-display text-2xl font-semibold">AI-Assisted Creative Brief Builder</h2>
        </div>

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Client name" value={form.clientName} onChange={updateField('clientName')} />
            <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Industry" value={form.industry} onChange={updateField('industry')} />
            <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-2" placeholder="Website" value={form.website} onChange={updateField('website')} />
            <textarea className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-2" rows="4" placeholder="Key competitors" value={form.competitors} onChange={updateField('competitors')} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 md:grid-cols-2">
            <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 capitalize dark:border-slate-700 dark:bg-slate-950" value={form.objective} onChange={updateField('objective')}>
              {objectives.map((item) => (
                <option key={item} value={item} className="capitalize">{item}</option>
              ))}
            </select>
            <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Budget (USD)" value={form.budget} onChange={updateField('budget')} />
            <textarea className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-2" rows="5" placeholder="Describe target audience" value={form.targetAudience} onChange={updateField('targetAudience')} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-2" placeholder="Tone (e.g. witty, premium, direct)" value={form.tone} onChange={updateField('tone')} />
            <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Imagery style" value={form.imageryStyle} onChange={updateField('imageryStyle')} />
            <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Color direction" value={form.colorDirection} onChange={updateField('colorDirection')} />
            <textarea className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 md:col-span-2" rows="5" placeholder="Do's and don'ts" value={form.dosAndDonts} onChange={updateField('dosAndDonts')} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-1 font-medium">{item.value || '-'}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Provider Settings</p>
              <div className="grid gap-2 md:grid-cols-3">
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={provider} onChange={(event) => setProvider(event.target.value)}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
                <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model" />
                <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="API key" type="password" />
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">Back</button>
          )}
          {step < 4 && (
            <button type="button" onClick={nextStep} className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">Continue</button>
          )}
          {step === 4 && (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? 'Generating...' : 'Generate Creative Direction'}
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">Creative Direction Output</h3>
          <button type="button" onClick={exportPdf} disabled={!output} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-700">
            Export as PDF
          </button>
        </div>

        {!output && (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Complete all form steps and submit to generate a structured creative direction document.
          </div>
        )}

        {output && (
          <article ref={outputRef} className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 print:shadow-none dark:border-slate-700">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Creative Direction</p>
            <h4 className="mt-2 font-display text-2xl font-semibold">{output.campaignTitle}</h4>

            <section className="mt-5">
              <h5 className="font-display text-lg font-semibold">Headline Options</h5>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {output.headlineOptions?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mt-5">
              <h5 className="font-display text-lg font-semibold">Tone of Voice Guide</h5>
              <p className="mt-2 leading-relaxed">{output.toneGuide}</p>
            </section>

            <section className="mt-5">
              <h5 className="font-display text-lg font-semibold">Recommended Channels</h5>
              <div className="mt-3 space-y-2">
                {output.recommendedChannels?.map((channel) => (
                  <div key={channel.channel} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-semibold">{channel.channel} - {channel.allocation}%</p>
                    <p className="text-sm text-slate-700">{channel.rationale}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5">
              <h5 className="font-display text-lg font-semibold">Key Visual Direction</h5>
              <p className="mt-2 leading-relaxed">{output.keyVisualDirection}</p>
            </section>
          </article>
        )}
      </section>
    </div>
  )
}

export default CreativeBriefBuilder
