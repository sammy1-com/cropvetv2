import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Leaf, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [show,  setShow]    = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signIn(email, pass)
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-forest flex items-center justify-center mb-3">
            <Leaf size={22} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-charcoal">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your farm dashboard</p>
        </div>

        <form onSubmit={handle} className="card space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</label>
            <input className="input mt-1" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="farmer@example.com" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
            <div className="relative mt-1">
              <input className="input pr-10" type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <Link to="/register" className="text-forest font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
