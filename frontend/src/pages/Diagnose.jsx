import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Upload, ImagePlus, Loader2, AlertTriangle, CheckCircle, ChevronRight, Camera } from 'lucide-react'

const HISTORY_KEY = 'cropvet_diagnosis_history'
const SEVERITY_STYLE = {
  healthy: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  low:     'bg-yellow-50 border-yellow-200 text-yellow-800',
  medium:  'bg-orange-50 border-orange-200 text-orange-800',
  high:    'bg-red-50 border-red-200 text-red-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
}

export default function Diagnose() {
  const navigate    = useNavigate()
  const inputRef    = useRef(null)
  const cameraRef   = useRef(null)
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [crop, setCrop]         = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleFile = f => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null); setError('')
  }

  const submit = async () => {
    if (!file) return
    setLoading(true); setError('')
    const fd = new FormData()
    fd.append('image', file)
    try {
      const { data } = await api.post('/api/diagnose/', fd)
      setResult(data)
      const record = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        crop: crop || 'Unknown',
        disease: data.disease,
        severity: data.severity,
        confidence: data.confidence,
        treatment_applied: false,
      }
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
      localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history]))
      const profile = JSON.parse(localStorage.getItem('cropvet_farm_profile') || '{"farm_id":"default","location":"Kenya","crops_active":[]}')
      api.post('/api/cropmind/think', {
        profile, history: [record, ...history],
        trigger: 'new_diagnosis', new_diagnosis: record
      }).catch(() => {})
    } catch (e) {
      setError(e.response?.data?.detail || 'Diagnosis failed. Check your API key.')
    }
    setLoading(false)
  }

  const markTreated = () => {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    if (history[0]) { history[0].treatment_applied = true; localStorage.setItem(HISTORY_KEY, JSON.stringify(history)) }
    setResult(r => ({ ...r, _treated: true }))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl text-charcoal">Crop Diagnosis</h1>
        <p className="text-gray-500 text-sm mt-1">Take a photo or upload one for an instant AI diagnosis.</p>
      </div>

      {/* Hidden file inputs */}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => handleFile(e.target.files[0])} />

      {!result && (
        <>
          {/* Camera + Upload buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-forest/40 rounded-2xl hover:border-forest hover:bg-forest/5 transition-all">
              <Camera size={28} className="text-forest" />
              <span className="text-sm font-semibold text-forest">Take Photo</span>
              <span className="text-xs text-gray-400">Use your camera</span>
            </button>
            <button onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-earth/40 rounded-2xl hover:border-earth hover:bg-earth/5 transition-all">
              <ImagePlus size={28} className="text-earth" />
              <span className="text-sm font-semibold text-earth">Upload Photo</span>
              <span className="text-xs text-gray-400">From gallery</span>
            </button>
          </div>

          {preview && (
            <div className="flex flex-col items-center gap-3">
              <img src={preview} alt="Preview" className="rounded-xl max-h-64 w-full object-contain border border-gray-100" />
              <button onClick={() => { setFile(null); setPreview(null) }}
                className="text-xs text-gray-400 hover:text-red-500">Remove photo</button>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Crop Name (optional)</label>
            <input className="input mt-1" placeholder="e.g. Maize, Tomato, Beans…"
              value={crop} onChange={e => setCrop(e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

          <button onClick={submit} disabled={!file || loading}
            className="btn-earth w-full flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Analysing…</>
              : <><Upload size={16} /> Diagnose Crop</>}
          </button>
        </>
      )}

      {result && (
        <div className={`border rounded-2xl p-5 space-y-4 fade-in ${SEVERITY_STYLE[result.severity] || SEVERITY_STYLE.info}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {result.severity === 'healthy'
                  ? <CheckCircle size={20} className="text-emerald-600" />
                  : <AlertTriangle size={20} className="text-orange-600" />}
                <h2 className="font-display text-xl">{result.disease}</h2>
              </div>
              <p className="text-xs opacity-70">Confidence: {result.confidence} · {crop || 'Crop'}</p>
            </div>
            <span className={`badge-${result.severity} shrink-0`}>{result.severity}</span>
          </div>
          <p className="text-sm leading-relaxed">{result.description}</p>
          {result.disease.toLowerCase() !== 'healthy' && (
            <>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1">Recommended Treatment</p>
                <p className="text-sm">{result.treatment}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1">Prevention</p>
                <p className="text-sm">{result.prevention}</p>
              </div>
            </>
          )}
          <div className="flex gap-2 pt-1 flex-wrap">
            {!result._treated && result.severity !== 'healthy' && (
              <button onClick={markTreated} className="btn-primary text-sm py-2 px-4">Mark as Treated</button>
            )}
            {result._treated && <p className="text-sm font-semibold text-emerald-700">✓ Marked as treated</p>}
            <button onClick={() => { setResult(null); setFile(null); setPreview(null); setCrop('') }}
              className="btn-outline text-sm py-2 px-4">New Diagnosis</button>
            <button onClick={() => navigate('/cropmind')}
              className="ml-auto text-sm text-earth font-semibold hover:underline flex items-center gap-1">
              CropMind Analysis <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}