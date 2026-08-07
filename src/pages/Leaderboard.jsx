import { useEffect, useState } from 'react'
import { Trophy, Medal } from 'lucide-react'
import { supabase } from '../lib/supabase'

const TABS = [
  { value: 'users', label: 'Пользователи' },
  { value: 'teams', label: 'Команды / города' },
]

const RANK_COLORS = ['text-amber-500', 'text-gray-400', 'text-amber-700']

export default function Leaderboard() {
  const [tab, setTab] = useState('users')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const table = tab === 'users' ? 'users' : 'teams'
    const select = tab === 'users' ? 'id, name, city, points_total, level' : 'id, name, city, points_total'

    supabase
      .from(table)
      .select(select)
      .order('points_total', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [tab])

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Trophy className="text-sea-dark" size={24} />
        Рейтинг
      </h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm border ${
              tab === t.value
                ? 'bg-gradient-to-r from-sea to-turquoise text-white border-sea'
                : 'border-sand-dark/40 text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-400 text-sm">Загрузка…</p>}

      <ol className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li
            key={row.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${
              i < 3 ? 'bg-white border-sand-dark/30' : 'bg-white/60 border-sand-dark/15'
            }`}
          >
            <span className="w-7 flex items-center justify-center shrink-0">
              {i < 3 ? (
                <Medal className={RANK_COLORS[i]} size={20} fill="currentColor" fillOpacity={0.15} />
              ) : (
                <span className="text-gray-400 text-sm font-medium">{i + 1}</span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{row.name}</div>
              {row.city && <div className="text-xs text-gray-500">{row.city}</div>}
            </div>
            {tab === 'users' && (
              <span className="text-xs text-gray-400 shrink-0">ур. {row.level}</span>
            )}
            <span className="font-semibold text-sea-dark shrink-0">{row.points_total}</span>
          </li>
        ))}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-gray-400">Пока никого нет в рейтинге.</p>
        )}
      </ol>
    </div>
  )
}
