import { useState, useEffect } from 'react'
import api from '../lib/api'
import { Brain, RefreshCw, CheckCircle, XCircle, AlertTriangle, TrendingUp, Lightbulb, Loader2, Zap } from 'lucide-react'

const HISTORY_KEY = 'cropvet_diagnosis_history'

const PRIORITY_CONFIG = {
  urgent: { cls: 'border-l-red-500 bg-red-50',     badge: 'badge-urgent', icon: <AlertTriangle size={15} className="text-red-500" /> },
  high:   { cls: 'border-l-orange-400 bg-orange-50', badge: 'badge-high',   icon: <Zap size={15} className="text-orange-500" /> },
  medium: { cls: 'border-l-yellow-400 bg-yellow-50', badge: 'badge-medium', icon: <TrendingUp size={15} className="text-yellow-600" /> },
  low:    { cls: 'border-l-green-400 bg-green-50',   badge: 'badge-low',    icon: <CheckCircle size={15} className="text-green-600" /> },
}

const TYPE_LABEL = {
  alert: 'Alert', recommendation: 'Recommendation', prediction: 'Prediction', autonomous: 'Autonomous'
}

function ScoreBar({ score }) {
  const color = score >= 85 ? 'bg-ok' : score >= 60 ? 'bg-warn' : 'bg-alert'
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
      <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
    </div>
  )
}

export default function CropMind() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [approvals, setApprovals] = useState({})
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  const profile = JSON.parse(localStorage.getItem('cropvet_farm_profile') || '{"farm_id":"default","location":"Kenya","crops_active":[]}')

  const fetchMind = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/cropmind/think', { profile, history, trigger: 'daily_check' })
      setData(data)
    } catch { setData(null) }
    setLoading(false)
  }

  useEffect(() => { fetchMind() }, [])

  const approve  = id => setApprovals(a => ({ ...a, [id]: true  }))
  const override = id => setApprovals(a => ({ ...a, [id]: false }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Brain size={22} className="text-earth" />
            <h1 className="font-display text-2xl text-charcoal">CropMind</h1>
          </div>
          <p className="text-gray-500 text-sm">Your farm's autonomous AI brain — built from your own diagnosis history.</p>
        </div>
        <button onClick={fetchMind} disabled={loading}
          className="btn-outline text-sm py-2 px-3 flex items-center gap-1.5 shrink-0">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin text-forest" />
          <p className="text-sm">CropMind is analysing your farm…</p>
        </div>
      )}

      {!loading && !data && (
        <div className="card text-center py-10">
          <Brain size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">CropMind couldn't connect to the backend.</p>
          <p className="text-xs text-gray-400 mt-1">Make sure the backend is running and try again.</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Greeting + score */}
          <div className="card border-l-4 border-earth fade-in">
            <p className="text-sm font-semibold text-earth mb-1">CropMind says:</p>
            <p className="text-charcoal text-sm">{data.greeting}</p>
            <p className="text-gray-500 text-xs mt-2">{data.summary}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Farm Health Score</span>
                <span className="font-semibold text-charcoal">{data.farm_score}/100</span>
              </div>
              <ScoreBar score={data.farm_score} />
            </div>
          </div>

          {/* Insights */}
          {data.insights?.length > 0 && (
            <div className="card fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-forest" />
                <h2 className="font-semibold text-sm text-charcoal">Farm Intelligence Insights</h2>
              </div>
              <ul className="space-y-1.5">
                {data.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-forest mt-0.5">·</span> {ins}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {data.actions?.length > 0 ? (
            <div className="space-y-3">
              <h2 className="font-display text-lg text-charcoal">Actions & Alerts</h2>
              {data.actions.map(action => {
                const cfg = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.low
                const approved = approvals[action.id]
                return (
                  <div key={action.id} className={`card border-l-4 ${cfg.cls} fade-in`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {cfg.icon}
                        <span className="font-semibold text-sm text-charcoal">{action.title}</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <span className={cfg.badge}>{action.priority}</span>
                        <span className="badge-low opacity-70">{TYPE_LABEL[action.type] || action.type}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{action.detail}</p>
                    {action.crop && <p className="text-xs text-gray-400 mt-1.5">Crop: {action.crop}</p>}
                    {action.suggested_date && <p className="text-xs text-gray-400">Suggested date: {action.suggested_date}</p>}

                    {action.requires_approval && approved === undefined && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => approve(action.id)} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => override(action.id)} className="btn-outline text-xs py-1.5 px-4 flex items-center gap-1">
                          <XCircle size={13} /> Override
                        </button>
                      </div>
                    )}
                    {approved === true  && <p className="text-xs text-emerald-600 font-semibold mt-2">✓ Approved</p>}
                    {approved === false && <p className="text-xs text-gray-400 font-semibold mt-2">↩ Overridden</p>}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card text-center py-8 fade-in">
              <CheckCircle size={28} className="text-ok mx-auto mb-2" />
              <p className="font-semibold text-gray-600">No actions needed right now.</p>
              <p className="text-xs text-gray-400 mt-1">Next check: {data.next_check}</p>
            </div>
          )}

          {/* No history nudge */}
          {history.length === 0 && (
            <div className="card text-center py-6 border-dashed border-2 border-gray-200 fade-in">
              <p className="text-sm text-gray-500">CropMind learns from your diagnosis history.</p>
              <p className="text-xs text-gray-400 mt-1">Upload your first crop photo to start building your farm memory.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
