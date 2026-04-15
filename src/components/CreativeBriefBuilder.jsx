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

function CreativeBriefBuilder({ currentUser }) {
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

  const stepLabels = ['Project', 'Strategy', 'Direction', 'Review']
  const isViewer = currentUser?.role === 'viewer'

  const handleSubmit = async () => {
    if (isViewer) {
      setError('Viewer accounts cannot generate creative directions. Contact an admin or manager.')
      return
    }

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
    <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
      <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mb-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">Step {step} of 4</p>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">AI-Assisted Creative Brief Builder</h2>
            </div>
            <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
              Move through the brief in sections, then generate a direction document you can export or refine.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((stepItem) => (
              <div
                key={stepItem}
                className={`h-2 rounded-full transition ${stepItem <= step ? 'bg-gradient-to-r from-cyan-600 to-sky-500' : 'bg-slate-200 dark:bg-slate-800'}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {stepLabels.map((label, index) => (
              <span
                key={label}
                className={`rounded-full border px-3 py-1 ${index + 1 === step ? 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-900/70 dark:bg-cyan-950/40 dark:text-cyan-300' : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" placeholder="Client name" value={form.clientName} onChange={updateField('clientName')} />
            <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" placeholder="Industry" value={form.industry} onChange={updateField('industry')} />
            <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 md:col-span-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Website" value={form.website} onChange={updateField('website')} />
            <textarea className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 md:col-span-2 dark:border-slate-700 dark:bg-slate-950" rows="4" placeholder="Key competitors" value={form.competitors} onChange={updateField('competitors')} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 md:grid-cols-2">
            <select className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" value={form.objective} onChange={updateField('objective')}>
              {objectives.map((item) => (
                <option key={item} value={item} className="capitalize">{item}</option>
              ))}
            </select>
            <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" placeholder="Budget (USD)" value={form.budget} onChange={updateField('budget')} />
            <textarea className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 md:col-span-2 dark:border-slate-700 dark:bg-slate-950" rows="5" placeholder="Describe target audience" value={form.targetAudience} onChange={updateField('targetAudience')} />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 md:col-span-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Tone (e.g. witty, premium, direct)" value={form.tone} onChange={updateField('tone')} />
            <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" placeholder="Imagery style" value={form.imageryStyle} onChange={updateField('imageryStyle')} />
            <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" placeholder="Color direction" value={form.colorDirection} onChange={updateField('colorDirection')} />
            <textarea className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 md:col-span-2 dark:border-slate-700 dark:bg-slate-950" rows="5" placeholder="Do's and don'ts" value={form.dosAndDonts} onChange={updateField('dosAndDonts')} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{item.value || '-'}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Provider Settings</p>
              <div className="grid gap-2 md:grid-cols-3">
                <select className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" value={provider} onChange={(event) => setProvider(event.target.value)}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
                <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model" />
                <input className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/15 dark:border-slate-700 dark:bg-slate-950" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="API key" type="password" />
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-100 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/40 dark:text-amber-200">{error}</p>}

        {isViewer && (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Role restriction: viewers can review briefs but cannot generate AI output.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Back</button>
          )}
          {step < 4 && (
            <button type="button" onClick={nextStep} className="rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20">Continue</button>
          )}
          {step === 4 && (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting || isViewer} className="rounded-full bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-60">
              {isSubmitting ? 'Generating...' : 'Generate Creative Direction'}
            </button>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-panel backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Generated output</p>
            <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">Creative direction</h3>
          </div>
          <button type="button" onClick={exportPdf} disabled={!output} className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">
            Export as PDF
          </button>
        </div>

        {!output && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
            Complete all form steps and submit to generate a structured creative direction document.
          </div>
        )}

        {output && (
          <article ref={outputRef} className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 print:shadow-none dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Creative Direction</p>
            <h4 className="mt-2 font-display text-2xl font-semibold">{output.campaignTitle}</h4>

            <section className="mt-5">
              <h5 className="font-display text-lg font-semibold">Headline Options</h5>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-200">
                {output.headlineOptions?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mt-5">
              <h5 className="font-display text-lg font-semibold">Tone of Voice Guide</h5>
              <p className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200">{output.toneGuide}</p>
            </section>

            <section className="mt-5">
              <h5 className="font-display text-lg font-semibold">Recommended Channels</h5>
              <div className="mt-3 space-y-2">
                {output.recommendedChannels?.map((channel) => (
                  <div key={channel.channel} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{channel.channel} - {channel.allocation}%</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{channel.rationale}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5">
              <h5 className="font-display text-lg font-semibold">Key Visual Direction</h5>
              <p className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200">{output.keyVisualDirection}</p>
            </section>
          </article>
        )}
      </section>
    </div>
  )
}

export default CreativeBriefBuilder
