import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Droplet,
  Fish,
  Clock,
  CheckCircle2,
  XCircle,
  Camera,
  Sparkles,
  Gift as GiftIcon,
} from 'lucide-react'
import MapView from '../components/MapView'
import ReportCard from '../components/ReportCard'
import { useReports } from '../hooks/useReports'
import { useAuth } from '../context/AuthContext'
import { REPORT_CATEGORIES, REPORT_STATUSES } from '../lib/constants'

const CATEGORY_ICONS = { litter: Trash2, oil: Droplet, wildlife: Fish }
const STATUS_ICONS = { pending_review: Clock, verified: CheckCircle2, rejected: XCircle }

const HOW_IT_WORKS = [
  {
    Icon: Camera,
    title: 'Сфотографируйте проблему',
    text: 'Мусор, разлив нефти или браконьерство — отметьте на карте и опишите.',
  },
  {
    Icon: Sparkles,
    title: 'ИИ и модератор проверяют',
    text: 'Фото анализирует ИИ, спорные случаи проверяет модератор вручную.',
  },
  {
    Icon: GiftIcon,
    title: 'Получите баллы и награды',
    text: 'Баллы копятся в профиле и обмениваются на призы от партнёров.',
  },
]

export default function Home() {
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const { user } = useAuth()
  const { reports, loading, error } = useReports({
    category: category || undefined,
    status: status || undefined,
  })

  const verifiedCount = reports.filter((r) => r.status === 'verified').length

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-sea-dark via-sea to-turquoise">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)",
            backgroundSize: '60px 60px, 90px 90px',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-10 opacity-25"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='40' viewBox='0 0 200 40'%3E%3Cpath d='M0 20 Q25 0 50 20 T100 20 T150 20 T200 20 V40 H0 Z' fill='white'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'repeat-x',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                Карта проблем Каспия
              </h1>
              <p className="text-sea-light/90 text-sm mt-1">
                Актау · открыто для всех, без регистрации
              </p>
            </div>
            <Link
              to={user ? '/reports/new' : '/login'}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white text-sea-dark px-5 py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              <Plus size={16} strokeWidth={2.5} />
              Создать репорт
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4 text-center">
              <div className="text-xl sm:text-2xl font-semibold text-white">{reports.length}</div>
              <div className="text-[11px] sm:text-xs text-sea-light/90 mt-0.5">Репортов</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4 text-center">
              <div className="text-xl sm:text-2xl font-semibold text-white">{verifiedCount}</div>
              <div className="text-[11px] sm:text-xs text-sea-light/90 mt-0.5">Подтверждено</div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4 text-center">
              <div className="text-xl sm:text-2xl font-semibold text-white">Актау</div>
              <div className="text-[11px] sm:text-xs text-sea-light/90 mt-0.5">Регион</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-3 py-1.5 text-xs sm:text-sm border ${
              category === '' ? 'bg-sea text-white border-sea' : 'border-sand-dark/40 text-gray-600'
            }`}
          >
            Все категории
          </button>
          {REPORT_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.value]
            return (
              <button
                key={c.value}
                onClick={() => setCategory(category === c.value ? '' : c.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm border ${
                  category === c.value
                    ? 'bg-sea text-white border-sea'
                    : 'border-sand-dark/40 text-gray-600'
                }`}
              >
                <Icon size={14} />
                {c.label}
              </button>
            )
          })}
          <span className="w-px bg-sand-dark/30 mx-1 hidden sm:block" />
          {REPORT_STATUSES.map((s) => {
            const Icon = STATUS_ICONS[s.value]
            return (
              <button
                key={s.value}
                onClick={() => setStatus(status === s.value ? '' : s.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm border ${
                  status === s.value
                    ? 'bg-sea-dark text-white border-sea-dark'
                    : 'border-sand-dark/40 text-gray-600'
                }`}
              >
                <Icon size={14} />
                {s.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MapView reports={reports} height="420px" />
          </div>
          <div>
            <h2 className="font-medium text-gray-900 mb-2">Последние репорты</h2>
            {loading && <p className="text-gray-400 text-sm">Загрузка…</p>}
            {error && (
              <p className="text-red-500 text-sm">
                Не удалось загрузить репорты. Проверьте настройку Supabase (.env).
              </p>
            )}
            <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
              {reports.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
              {!loading && !error && reports.length === 0 && (
                <p className="text-gray-400 text-sm">Пока нет репортов.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {HOW_IT_WORKS.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-sand-dark/20 bg-white p-5 shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sea to-turquoise text-white flex items-center justify-center mb-3">
                <Icon size={20} />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
