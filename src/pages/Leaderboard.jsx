import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TABS = [
  { value: 'users', label: 'Пользователи' },
  { value: 'teams', label: 'Команды / города' },
]

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Рейтинг</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm border ${
              tab === t.value ? 'bg-sea text-white border-sea' : 'border-gray-300 text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-400 text-sm">Загрузка…</p>}

      <ol className="flex flex-col gap-1">
        {rows.map((row, i) => (
          <li
            key={row.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5"
          >
            <span className="w-6 text-gray-400 text-sm font-medium">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{row.name}</div>
              {row.city && <div className="text-xs text-gray-500">{row.city}</div>}
            </div>
            {tab === 'users' && (
              <span className="text-xs text-gray-400">ур. {row.level}</span>
            )}
            <span className="font-semibold text-sea-dark">{row.points_total}</span>
          </li>
        ))}
        {!loading && rows.length === 0 && (
          <p className="text-sm text-gray-400">Пока никого нет в рейтинге.</p>
        )}
      </ol>
    </div>
  )
}
