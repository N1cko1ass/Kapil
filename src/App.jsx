import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import NewReport from './pages/NewReport'
import ReportDetail from './pages/ReportDetail'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route
          path="/reports/new"
          element={
            <ProtectedRoute>
              <NewReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
