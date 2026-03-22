import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Landing      from './pages/Landing'
import Login        from './pages/auth/Login'
import Register     from './pages/auth/Register'
import Verify2FA    from './pages/auth/Verify2FA'
import Dashboard    from './pages/Dashboard'
import Diagnose     from './pages/Diagnose'
import CropMind     from './pages/CropMind'
import Assistant    from './pages/Assistant'
import Timeline     from './pages/Timeline'
import Marketplace  from './pages/Marketplace'
import MapView      from './pages/MapView'
import Settings     from './pages/Settings'

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return (
    <Routes>
      <Route path="/"          element={<Landing />} />
      <Route path="/login"     element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register"  element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/verify"    element={<Verify2FA />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/diagnose"    element={<Diagnose />} />
        <Route path="/cropmind"    element={<CropMind />} />
        <Route path="/assistant"   element={<Assistant />} />
        <Route path="/timeline"    element={<Timeline />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/map"         element={<MapView />} />
        <Route path="/settings"    element={<Settings />} />
        
      </Route>
    </Routes>
  )
}
