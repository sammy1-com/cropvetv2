import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ShieldCheck } from 'lucide-react'

export default function Verify2FA() {
  const { sendOtp, verifyOtp } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { fromRegister } = location.state || {}

  const [step,  setStep]  = useState(fromRegister ? 'email_sent' : 'phone')
  const [phone, setPhone] = useState('')
  const [otp,   setOtp]   = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    const formatted = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`
    const { error } = await sendOtp(formatted)
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('verify_phone')
  }

  const handleVerifyOtp = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    const formatted = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`
    const { error } = await verifyOtp(formatted, otp)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  if (step === 'email_sent') return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-forest/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={28} className="text-forest" />
        </div>
        <h1 className="font-display text-2xl text-charcoal mb-2">Check your email</h1>
        <p className="text-sm text-gray-500 mb-6">We sent a confirmation link. Click it, then come back to add your phone number for 2FA.</p>
        <button onClick={() => setStep('phone')} className="btn-primary w-full">Continue to Phone Verification</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 flex items-center justify-center mb-3">
            <ShieldCheck size={24} className="text-forest" />
          </div>
          <h1 className="font-display text-2xl text-charcoal">
            {step === 'phone' ? 'Phone Verification' : 'Enter OTP'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'phone' ? 'Add your phone for 2-factor security' : 'Enter the code sent via SMS'}
          </p>
        </div>

        <div className="card">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phone Number</label>
                <input className="input mt-1" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="0712 345 678 or +254..." required />
                <p className="text-xs text-gray-400 mt-1">Kenya numbers auto-formatted to +254</p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">6-Digit Code</label>
                <input className="input mt-1 text-center text-xl tracking-widest font-mono" type="text"
                  value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} placeholder="000000" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="text-sm text-gray-500 w-full text-center hover:underline">
                Wrong number? Go back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
