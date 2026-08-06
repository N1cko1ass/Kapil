import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NewReport from './pages/NewReport'
import ReportDetail from './pages/ReportDetail'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Rewards from './pages/Rewards'
import PartnerCabinet from './pages/PartnerCabinet'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route
          path="/reports/new"
          element={
            <ProtectedRoute>
              <NewReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner"
          element={
            <ProtectedRoute>
              <PartnerCabinet />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
