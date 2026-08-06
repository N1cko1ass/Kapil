import { useState } from 'react'
import { Link } from 'react-router-dom'
import MapView from '../components/MapView'
import ReportCard from '../components/ReportCard'
import { useReports } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'
import { REPORT_CATEGORIES, REPORT_STATUSES } from '../lib/constants'

export default function Home() {
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const { user } = useAuth()
  const { reports, loading, error } = useReports({
    category: category || undefined,
    status: status || undefined,
  })

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-sea-dark via-sea to-turquoise">
        <div
          className="absolute inset-x-0 bottom-0 h-10 opacity-25"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='40' viewBox='0 0 200 40'%3E%3Cpath d='M0 20 Q25 0 50 20 T100 20 T150 20 T200 20 V40 H0 Z' fill='white'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'repeat-x',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 py-10 relative animate-fade-in-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-white">Карта проблем Каспия</h1>
              <p className="text-sea-light/90 text-sm mt-1">
                Актау · открыто для всех, без регистрации
              </p>
            </div>
            <Link
              to={user ? '/reports/new' : '/login'}
              className="rounded-md bg-white text-sea-dark px-5 py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl"
            >
              + Создать репорт
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-3 mb-4 text-sm">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5"
        >
          <option value="">Все категории</option>
          {REPORT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5"
        >
          <option value="">Все статусы</option>
          {REPORT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView reports={reports} height="500px" />
        </div>
        <div>
          <h2 className="font-medium text-gray-900 mb-2">Последние репорты</h2>
          {loading && <p className="text-gray-400 text-sm">Загрузка…</p>}
          {error && (
            <p className="text-red-500 text-sm">
              Не удалось загрузить репорты. Проверьте настройку Supabase (.env).
            </p>
          )}
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
            {!loading && !error && reports.length === 0 && (
              <p className="text-gray-400 text-sm">Пока нет репортов.</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
