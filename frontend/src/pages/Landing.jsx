import { useNavigate } from 'react-router-dom'
import { Leaf, Brain, Microscope, MessageSquare } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-4 max-w-5xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-earth flex items-center justify-center shrink-0">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-display text-xl text-charcoal">
            CropVet<span className="text-forest-light">AI</span>
          </span>
        </div>

        {/* Buttons — stack on very small screens, row on sm+ */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => navigate('/login')}
            className="btn-outline text-sm py-2 px-3 md:px-4 whitespace-nowrap">
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-earth text-sm py-2 px-3 md:px-4 whitespace-nowrap">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-forest/10 text-forest text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          <Brain size={14} /> AI-Powered Farm Intelligence
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-charcoal leading-tight mb-4">
          The Farm's Own<br />
          <span className="text-forest">AI Brain</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto mb-8">
          CropVet gives your farm autonomous AI that learns your land, catches disease before it spreads, and acts — so you don't have to.
        </p>
        <button onClick={() => navigate('/register')} className="btn-primary text-base px-8 py-3">
          Start for Free
        </button>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-5">
        {[
          { icon: Microscope, title: 'Instant Diagnosis', desc: 'Upload a photo. AI identifies crop disease in seconds with treatment recommendations.', color: 'text-forest' },
          { icon: Brain, title: 'CropMind Agent', desc: 'Your farm builds its own memory. CropMind detects patterns and acts autonomously.', color: 'text-earth' },
          { icon: MessageSquare, title: 'Farm Assistant', desc: 'Ask anything about your crops. Get expert advice in English or Swahili.', color: 'text-forest' },
        ].map(f => (
          <div key={f.title} className="card hover:shadow-hover transition-shadow">
            <f.icon size={28} className={`${f.color} mb-3`} />
            <h3 className="font-display text-lg text-charcoal mb-1">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400 font-body">
        Built for Kenyan smallholder farmers · CropVetAI 2026
      </footer>
    </div>
  )
}
