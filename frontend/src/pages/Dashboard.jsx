import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import { Brain, Microscope, CalendarDays, ShoppingBag, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const HISTORY_KEY = 'cropvet_diagnosis_history'

function ScoreRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 85 ? '#52B788' : score >= 60 ? '#F4A261' : '#E63946'
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="text-center">
        <div className="font-display text-2xl text-charcoal leading-none">{score}</div>
        <div className="text-xs text-gray-400">/ 100</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mind, setMind]     = useState(null)
  const [loading, setLoading] = useState(true)
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')

  useEffect(() => {
    const profile = JSON.parse(localStorage.getItem('cropvet_farm_profile') || '{"farm_id":"default","location":"Kenya","crops_active":[],"farm_size_acres":1}')
    api.post('/api/cropmind/think', { profile, history, trigger: 'daily_check' })
      .then(r => setMind(r.data))
      .catch(() => setMind(null))
      .finally(() => setLoading(false))
  }, [])

  const urgent = mind?.actions?.filter(a => a.priority === 'urgent') || []
  const email = user?.email || 'Farmer'

  const quickCards = [
    { icon: Microscope, label: 'Diagnose Crop',  sub: 'Upload a photo',      to: '/diagnose',    color: 'bg-forest/10 text-forest' },
    { icon: Brain,      label: 'CropMind',        sub: 'View AI briefing',    to: '/cropmind',    color: 'bg-earth/10 text-earth' },
    { icon: CalendarDays,label: 'Timeline',       sub: 'Farm schedule',       to: '/timeline',    color: 'bg-forest/10 text-forest' },
    { icon: ShoppingBag,label: 'Marketplace',     sub: 'Buy agro-inputs',     to: '/marketplace', color: 'bg-earth/10 text-earth' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-charcoal">Good morning 👋</h1>
        <p className="text-gray-500 text-sm mt-0.5">{email} · {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Urgent alert banner */}
      {urgent.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 fade-in">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 text-sm">{urgent.length} Urgent Action{urgent.length > 1 ? 's' : ''} Required</p>
            <p className="text-red-600 text-xs mt-0.5">{urgent[0].title}</p>
          </div>
          <button onClick={() => navigate('/cropmind')} className="ml-auto text-xs text-red-600 font-semibold hover:underline shrink-0">View →</button>
        </div>
      )}

      {/* Score + stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card col-span-2 md:col-span-1 flex flex-col items-center justify-center py-4">
          {loading ? <div className="w-24 h-24 rounded-full border-8 border-gray-100 animate-pulse" /> : <ScoreRing score={mind?.farm_score ?? 100} />}
          <p className="text-xs text-gray-500 mt-2 font-semibold">Farm Health Score</p>
        </div>
        {[
          { icon: Microscope,   label: 'Total Diagnoses', value: history.length,                           color: 'text-forest' },
          { icon: AlertTriangle,label: 'Issues (30d)',     value: history.filter(r => r.severity !== 'healthy' && r.severity !== 'info').length, color: 'text-warn' },
          { icon: CheckCircle,  label: 'Resolved',        value: history.filter(r => r.treatment_applied).length, color: 'text-ok' },
        ].map(s => (
          <div key={s.label} className="card flex flex-col justify-between">
            <s.icon size={18} className={s.color} />
            <div>
              <div className="font-display text-3xl text-charcoal">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-lg text-charcoal mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickCards.map(c => (
            <button key={c.to} onClick={() => navigate(c.to)}
              className="card text-left hover:shadow-hover transition-all active:scale-95">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
                <c.icon size={18} />
              </div>
              <p className="font-semibold text-sm text-charcoal">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* CropMind summary */}
      {mind && (
        <div className="card border-l-4 border-earth fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-earth" />
            <span className="text-xs font-semibold text-earth uppercase tracking-wide">CropMind Briefing</span>
          </div>
          <p className="text-sm text-charcoal">{mind.summary}</p>
          {mind.insights.slice(0,2).map((ins, i) => (
            <p key={i} className="text-xs text-gray-500 mt-1">· {ins}</p>
          ))}
          <button onClick={() => navigate('/cropmind')} className="mt-3 text-xs text-earth font-semibold hover:underline">
            Full briefing →
          </button>
        </div>
      )}

      {/* Recent diagnoses */}
      {history.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-charcoal mb-3">Recent Diagnoses</h2>
          <div className="space-y-2">
            {history.slice(0, 4).map((r, i) => (
              <div key={i} className="card flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-semibold text-sm text-charcoal">{r.disease}</p>
                  <p className="text-xs text-gray-400">{r.crop} · {r.date}</p>
                </div>
                <span className={`badge-${r.severity}`}>{r.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
