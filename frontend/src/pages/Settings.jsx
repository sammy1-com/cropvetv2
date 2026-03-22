import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, User, Shield, Trash2, Save } from 'lucide-react'

const PROFILE_KEY = 'cropvet_farm_profile'
const HISTORY_KEY = 'cropvet_diagnosis_history'

export default function Settings() {
  const { user, signOut, sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState({ location: 'Kenya', crops_active: [], farm_size_acres: 1 })
  const [cropInput, setCropInput] = useState('')
  const [saved, setSaved]   = useState(false)
  const [phone, setPhone]   = useState('')
  const [otp, setOtp]       = useState('')
  const [otpSent, setOtpSent]   = useState(false)
  const [otpDone, setOtpDone]   = useState(false)
  const [otpError, setOtpError] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
    if (stored) setProfile(stored)
  }, [])

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, farm_id: user?.id || 'default' }))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const addCrop = () => {
    const c = cropInput.trim()
    if (c && !profile.crops_active.includes(c)) {
      setProfile(p => ({ ...p, crops_active: [...p.crops_active, c] }))
    }
    setCropInput('')
  }

  const removeCrop = crop => setProfile(p => ({ ...p, crops_active: p.crops_active.filter(c => c !== crop) }))

  const handleSendOtp = async () => {
    setOtpError('')
    const formatted = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`
    const { error } = await sendOtp(formatted)
    if (error) { setOtpError(error.message); return }
    setOtpSent(true)
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    const formatted = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`
    const { error } = await verifyOtp(formatted, otp)
    if (error) { setOtpError(error.message); return }
    setOtpDone(true)
  }

  const clearHistory = () => {
    if (confirm('Clear all diagnosis history? This cannot be undone.')) {
      localStorage.removeItem(HISTORY_KEY)
    }
  }

  const handleSignOut = async () => { await signOut(); navigate('/') }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-2">
        <SettingsIcon size={20} className="text-forest" />
        <h1 className="font-display text-2xl text-charcoal">Settings</h1>
      </div>

      {/* Account */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User size={16} className="text-forest" />
          <h2 className="font-semibold text-sm text-charcoal">Account</h2>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-charcoal">Email: </span>{user?.email}
        </div>
        <button onClick={handleSignOut} className="text-sm text-red-500 hover:underline">Sign out</button>
      </div>

      {/* Farm profile */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-sm text-charcoal flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-forest/10 flex items-center justify-center text-forest text-xs">🌱</span>
          Farm Profile
        </h2>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
          <input className="input mt-1" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Nakuru, Kenya" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Farm Size (acres)</label>
          <input className="input mt-1" type="number" min="0.1" step="0.1" value={profile.farm_size_acres}
            onChange={e => setProfile(p => ({ ...p, farm_size_acres: parseFloat(e.target.value) }))} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Crops</label>
          <div className="flex gap-2 mt-1">
            <input className="input flex-1" placeholder="Add crop…" value={cropInput}
              onChange={e => setCropInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCrop()} />
            <button onClick={addCrop} className="btn-outline text-sm px-3">Add</button>
          </div>
          {profile.crops_active.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.crops_active.map(c => (
                <span key={c} className="flex items-center gap-1 text-xs bg-forest/10 text-forest px-2.5 py-1 rounded-full">
                  {c}
                  <button onClick={() => removeCrop(c)} className="hover:text-red-500 ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <button onClick={saveProfile} className="btn-primary flex items-center gap-2 text-sm">
          <Save size={14} /> {saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>

      {/* 2FA */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-forest" />
          <h2 className="font-semibold text-sm text-charcoal">Two-Factor Authentication (SMS)</h2>
        </div>
        {otpDone ? (
          <p className="text-sm text-emerald-600 font-semibold">✓ Phone number verified. 2FA is active.</p>
        ) : (
          <>
            {otpError && <p className="text-xs text-red-500">{otpError}</p>}
            <div className="flex gap-2">
              <input className="input flex-1" type="tel" placeholder="Phone number (0712...)" value={phone} onChange={e => setPhone(e.target.value)} />
              <button onClick={handleSendOtp} disabled={otpSent} className="btn-outline text-sm px-3">
                {otpSent ? 'Sent' : 'Send OTP'}
              </button>
            </div>
            {otpSent && (
              <div className="flex gap-2">
                <input className="input flex-1 font-mono text-center tracking-widest" maxLength={6}
                  placeholder="000000" value={otp} onChange={e => setOtp(e.target.value)} />
                <button onClick={handleVerifyOtp} className="btn-primary text-sm px-3">Verify</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Danger zone */}
      <div className="card border border-red-100 space-y-3">
        <h2 className="font-semibold text-sm text-red-600 flex items-center gap-2">
          <Trash2 size={15} /> Danger Zone
        </h2>
        <p className="text-xs text-gray-500">Clear your local diagnosis history. CropMind will lose its farm memory.</p>
        <button onClick={clearHistory} className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
          Clear Diagnosis History
        </button>
      </div>
    </div>
  )
}
