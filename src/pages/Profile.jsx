import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ReportCard from '../components/ReportCard'
import BadgeIcon from '../components/BadgeIcon'

export default function Profile() {
  const { user, profile } = useAuth()
  const [reports, setReports] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_badges')
        .select('earned_at, badges(*)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false }),
    ]).then(([reportsRes, badgesRes]) => {
      setReports(reportsRes.data ?? [])
      setBadges((badgesRes.data ?? []).map((row) => row.badges).filter(Boolean))
      setLoading(false)
    })
  }, [user])

  if (!profile) return <p className="p-8 text-center text-gray-400">Загрузка…</p>

  const verifiedCount = reports.filter((r) => r.status === 'verified').length
  const pointsToNextLevel = 100 - (profile.points_total % 100)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{profile.name}</h1>
          <p className="text-gray-500 text-sm">
            {profile.city} · {profile.email}
          </p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-semibold text-sea-dark">{profile.points_total}</div>
            <div className="text-xs text-gray-500">баллов</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-sea-dark">{profile.level}</div>
            <div className="text-xs text-gray-500">уровень</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-sea-dark">{verifiedCount}</div>
            <div className="text-xs text-gray-500">репортов</div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-8">
        До следующего уровня: {pointsToNextLevel} баллов
      </p>

      <section className="mb-8">
        <h2 className="font-medium text-gray-900 mb-3">Значки</h2>
        {badges.length === 0 ? (
          <p className="text-sm text-gray-400">Пока нет значков — отправляйте репорты!</p>
        ) : (
          <div className="flex gap-4 flex-wrap">
            {badges.map((b) => (
              <BadgeIcon key={b.id} badge={b} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3">История репортов</h2>
        {loading && <p className="text-sm text-gray-400">Загрузка…</p>}
        <div className="flex flex-col gap-2">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
          {!loading && reports.length === 0 && (
            <p className="text-sm text-gray-400">Вы ещё не отправляли репорты.</p>
          )}
        </div>
      </section>
    </div>
  )
}
