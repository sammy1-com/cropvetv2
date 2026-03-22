import { useEffect, useRef, useState } from 'react'
import { MapPin, Store, Leaf, AlertTriangle, Loader2 } from 'lucide-react'

const HISTORY_KEY = 'cropvet_diagnosis_history'

// Real agro-dealer locations in Kenya
const AGRO_DEALERS = [
  { name: "Amiran Kenya - Nairobi", lat: -1.2921, lng: 36.8219, type: "dealer", phone: "+254 20 6900000" },
  { name: "MEA Fertilizers - Nakuru", lat: -0.3031, lng: 36.0800, type: "dealer", phone: "+254 51 2211000" },
  { name: "Kenya Seed Company - Kitale", lat: 1.0154, lng: 35.0062, type: "dealer", phone: "+254 54 31009" },
  { name: "Farmers Choice - Eldoret", lat: 0.5143, lng: 35.2698, type: "dealer", phone: "+254 53 2033000" },
  { name: "Amiran Kenya - Mombasa", lat: -4.0435, lng: 39.6682, type: "dealer", phone: "+254 41 2229000" },
  { name: "AgroServe - Kisumu", lat: -0.0917, lng: 34.7679, type: "dealer", phone: "+254 57 2024000" },
  { name: "Syngenta Kenya - Nairobi", lat: -1.3005, lng: 36.7873, type: "dealer", phone: "+254 20 4451000" },
  { name: "Farm & City Centre - Nairobi", lat: -1.2864, lng: 36.8233, type: "dealer", phone: "+254 20 2710000" },
  { name: "Simlaw Seeds - Nairobi", lat: -1.2748, lng: 36.8320, type: "dealer", phone: "+254 20 3744000" },
  { name: "Kenya Seed - Nairobi", lat: -1.3190, lng: 36.8773, type: "dealer", phone: "+254 20 8561000" },
]

// Simulated disease outbreak data by region
const OUTBREAKS = [
  { name: "Fall Armyworm Outbreak", lat: -0.5, lng: 35.5, severity: "high", region: "Rift Valley", crop: "Maize" },
  { name: "Late Blight", lat: -1.0, lng: 37.0, severity: "medium", region: "Central Kenya", crop: "Potato" },
  { name: "Bacterial Wilt", lat: -0.1, lng: 34.8, severity: "medium", region: "Nyanza", crop: "Tomato" },
  { name: "Maize Streak Virus", lat: 0.5, lng: 35.0, severity: "low", region: "Western Kenya", crop: "Maize" },
  { name: "Coffee Berry Disease", lat: -0.7, lng: 36.9, severity: "high", region: "Kirinyaga", crop: "Coffee" },
  { name: "Powdery Mildew", lat: -3.2, lng: 40.1, severity: "low", region: "Coast", crop: "Beans" },
]

const SEVERITY_COLOR = { high: "#E63946", medium: "#F4A261", low: "#52B788" }

export default function MapView() {
  const mapRef     = useRef(null)
  const mapObj     = useRef(null)
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
  const [farmLat, setFarmLat]   = useState(null)
  const [farmLng, setFarmLng]   = useState(null)
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id   = 'leaflet-css'
      link.rel  = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => initMap()
    document.head.appendChild(script)

    return () => { if (mapObj.current) { mapObj.current.remove(); mapObj.current = null } }
  }, [])

  const initMap = () => {
    if (mapObj.current) return
    const L = window.L
    const map = L.map(mapRef.current, { center: [-0.5, 37.0], zoom: 7 })
    mapObj.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Get farmer's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setFarmLat(lat); setFarmLng(lng)
        const farmIcon = L.divIcon({
          html: `<div style="background:#2D6A4F;border:3px solid white;border-radius:50%;width:20px;height:20px;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
          iconSize: [20, 20], iconAnchor: [10, 10], className: ''
        })
        L.marker([lat, lng], { icon: farmIcon })
          .addTo(map)
          .bindPopup('<b>📍 Your Farm</b><br>Your current location')
        map.setView([lat, lng], 9)
      }, () => {})
    }

    // Agro-dealer markers
    AGRO_DEALERS.forEach(d => {
      const icon = L.divIcon({
        html: `<div style="background:#A0522D;border:2px solid white;border-radius:4px;width:16px;height:16px;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8], className: ''
      })
      L.marker([d.lat, d.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>🏪 ${d.name}</b><br>📞 ${d.phone}`)
    })

    // Disease outbreak circles
    OUTBREAKS.forEach(o => {
      L.circle([o.lat, o.lng], {
        color: SEVERITY_COLOR[o.severity],
        fillColor: SEVERITY_COLOR[o.severity],
        fillOpacity: 0.25,
        radius: o.severity === 'high' ? 50000 : o.severity === 'medium' ? 35000 : 20000,
        weight: 2
      }).addTo(map)
        .bindPopup(`<b>⚠️ ${o.name}</b><br>Crop: ${o.crop}<br>Region: ${o.region}<br>Severity: ${o.severity}`)
    })

    // User's own diagnosis history as markers
    history.filter(r => r.severity !== 'healthy').forEach(r => {
      if (farmLat && farmLng) {
        const offset = (Math.random() - 0.5) * 0.05
        L.circleMarker([farmLat + offset, farmLng + offset], {
          color: '#1A1A1A', fillColor: '#F4A261',
          fillOpacity: 0.8, radius: 6, weight: 2
        }).addTo(map)
          .bindPopup(`<b>🔍 ${r.disease}</b><br>Crop: ${r.crop}<br>Date: ${r.date}`)
      }
    })

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <MapPin size={20} className="text-forest" />
          <h1 className="font-display text-2xl text-charcoal">Farm Map</h1>
        </div>
        <p className="text-gray-500 text-sm">Agro-dealers, disease outbreaks and your farm — all in one view.</p>
      </div>

      {/* Legend */}
      <div className="card flex flex-wrap gap-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-4 h-4 rounded-full bg-forest border-2 border-white shadow" />
          Your farm
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-4 h-4 rounded bg-earth border-2 border-white shadow" />
          Agro-dealer
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-4 h-4 rounded-full bg-red-500 opacity-50" />
          High outbreak
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-4 h-4 rounded-full bg-warn opacity-50" />
          Medium outbreak
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-4 h-4 rounded-full bg-ok opacity-50" />
          Low outbreak
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-card" style={{ height: '60vh', minHeight: '400px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-forest" />
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Nearby outbreaks list */}
      <div>
        <h2 className="font-display text-lg text-charcoal mb-3">Active Disease Outbreaks</h2>
        <div className="space-y-2">
          {OUTBREAKS.map((o, i) => (
            <div key={i} className="card flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[o.severity] }} />
                <div>
                  <p className="text-sm font-semibold text-charcoal">{o.name}</p>
                  <p className="text-xs text-gray-400">{o.region} · {o.crop}</p>
                </div>
              </div>
              <span className={`badge-${o.severity === 'high' ? 'urgent' : o.severity === 'medium' ? 'medium' : 'low'}`}>
                {o.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
