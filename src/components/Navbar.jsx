import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import {
  Map,
  Trophy,
  Gift,
  CalendarDays,
  PlusCircle,
  Store,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', end: true, label: 'Карта', Icon: Map },
  { to: '/leaderboard', label: 'Рейтинг', Icon: Trophy },
  { to: '/rewards', label: 'Награды', Icon: Gift },
  { to: '/events', label: 'Акции', Icon: CalendarDays },
]

const navLinkClass = ({ isActive }) =>
  `relative py-1 flex items-center gap-1.5 text-gray-600 hover:text-sea-dark after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-sea after:to-turquoise after:transition-all after:duration-300 ${
    isActive ? 'text-sea-dark font-medium after:w-full' : 'after:w-0 hover:after:w-full'
  }`

const mobileLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
    isActive ? 'bg-sea/10 text-sea-dark font-medium' : 'text-gray-600 hover:bg-sand/30'
  }`

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const allItems = [
    ...navItems,
    ...(user ? [{ to: '/reports/new', label: 'Новый репорт', Icon: PlusCircle }] : []),
    ...(profile?.role === 'partner'
      ? [{ to: '/partner', label: 'Кабинет партнёра', Icon: Store }]
      : []),
  ]

  return (
    <header className="sticky top-0 z-[1000] border-b border-sand-dark/20 bg-cream/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sea-dark text-lg shrink-0">
          <Logo size={32} />
          Kepil
        </Link>

        <nav className="hidden lg:flex items-center gap-5 text-sm">
          {allItems.map(({ to, end, label, Icon }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
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
                className="flex items-center gap-1.5 rounded-md border border-sand-dark/40 px-3 py-1.5 hover:bg-sand/30"
              >
                <LogOut size={15} />
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

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden p-2 -mr-2 rounded-md text-sea-dark"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="lg:hidden border-t border-sand-dark/20 bg-cream px-4 py-3 flex flex-col gap-1 animate-fade-in-up">
          {allItems.map(({ to, end, label, Icon }) => (
            <NavLink key={to} to={to} end={end} className={mobileLinkClass} onClick={() => setMenuOpen(false)}>
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
          <div className="my-2 h-px bg-sand-dark/20" />
          {user ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700"
              >
                {profile?.name ?? user.email}
                {profile && (
                  <span className="text-sea-dark font-semibold">· {profile.points_total}</span>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left text-gray-600 hover:bg-sand/30"
              >
                <LogOut size={18} />
                Выйти
              </button>
            </>
          ) : (
            <div className="flex gap-2 px-1">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center rounded-md border border-sand-dark/40 px-3 py-2 text-sm text-gray-700"
              >
                Войти
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center rounded-md bg-gradient-to-r from-sea to-turquoise text-white px-3 py-2 text-sm font-medium"
              >
                Регистрация
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}
