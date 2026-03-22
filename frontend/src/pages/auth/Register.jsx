import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Leaf } from 'lucide-react'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signUp(email, pass)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-earth flex items-center justify-center mb-3">
            <Leaf size={22} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-charcoal">Create your farm</h1>
          <p className="text-sm text-gray-500 mt-1">Join thousands of Kenyan farmers using AI.</p>
        </div>

        <form onSubmit={handle} className="card space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</label>
            <input className="input mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="farmer@example.com" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
            <input className="input mt-1" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="At least 8 characters" minLength={8} required />
          </div>
          <button type="submit" disabled={loading} className="btn-earth w-full mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-xs text-center text-gray-400">
            A verification email will be sent to confirm your account.
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already registered? <Link to="/login" className="text-forest font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
