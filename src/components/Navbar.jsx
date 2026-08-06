import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-[1000]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold text-sea-dark text-lg">
          Kepil
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-sea-dark">
            Карта
          </Link>
          {user && (
            <Link to="/reports/new" className="text-gray-600 hover:text-sea-dark">
              Новый репорт
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-500">{profile?.name ?? user.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-gray-600 hover:text-sea-dark">
                Войти
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-sea text-white px-3 py-1.5 hover:bg-sea-dark"
              >
                Регистрация
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
