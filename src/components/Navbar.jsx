import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const navLinkClass = ({ isActive }) =>
  `relative py-1 text-gray-600 hover:text-sea-dark after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-sea after:to-turquoise after:transition-all after:duration-300 ${
    isActive ? 'text-sea-dark font-medium after:w-full' : 'after:w-0 hover:after:w-full'
  }`

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-[1000] border-b border-sand-dark/20 bg-cream/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sea-dark text-lg">
          <Logo size={32} />
          Kepil
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <NavLink to="/" end className={navLinkClass}>
            Карта
          </NavLink>
          <NavLink to="/leaderboard" className={navLinkClass}>
            Рейтинг
          </NavLink>
          <NavLink to="/rewards" className={navLinkClass}>
            Награды
          </NavLink>
          <NavLink to="/events" className={navLinkClass}>
            Акции
          </NavLink>
          {user && (
            <NavLink to="/reports/new" className={navLinkClass}>
              Новый репорт
            </NavLink>
          )}
          {profile?.role === 'partner' && (
            <NavLink to="/partner" className={navLinkClass}>
              Кабинет партнёра
            </NavLink>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="text-gray-500 hover:text-sea-dark">
                {profile?.name ?? user.email}
                {profile && (
                  <span className="text-sea-dark font-semibold"> · {profile.points_total}</span>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-md border border-sand-dark/40 px-3 py-1.5 hover:bg-sand/30"
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
                className="rounded-md bg-gradient-to-r from-sea to-turquoise text-white px-3 py-1.5 shadow-sm hover:shadow-md"
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
