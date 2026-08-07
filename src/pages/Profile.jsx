import { useEffect, useState } from 'react'
import { Award, Gift, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import ReportCard from '../components/ReportCard'
import BadgeIcon from '../components/BadgeIcon'

export default function Profile() {
  const { user, profile } = useAuth()
  const [reports, setReports] = useState([])
  const [badges, setBadges] = useState([])
  const [redemptions, setRedemptions] = useState([])
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
      supabase
        .from('redemptions')
        .select('*, rewards(title, partners(name))')
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false }),
    ]).then(([reportsRes, badgesRes, redemptionsRes]) => {
      setReports(reportsRes.data ?? [])
      setBadges((badgesRes.data ?? []).map((row) => row.badges).filter(Boolean))
      setRedemptions(redemptionsRes.data ?? [])
      setLoading(false)
    })
  }, [user])

  if (!profile) return <p className="p-8 text-center text-gray-400">Загрузка…</p>

  const verifiedCount = reports.filter((r) => r.status === 'verified').length
  const levelProgress = profile.points_total % 100
  const pointsToNextLevel = 100 - levelProgress

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-2xl bg-gradient-to-br from-sea-dark via-sea to-turquoise p-5 sm:p-6 text-white mb-8 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-xl sm:text-2xl font-semibold">
            {profile.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold truncate">{profile.name}</h1>
            <p className="text-sea-light/90 text-sm truncate">
              {profile.city} · {profile.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-2 py-3 text-center">
            <div className="text-xl sm:text-2xl font-semibold">{profile.points_total}</div>
            <div className="text-[11px] sm:text-xs text-sea-light/90">баллов</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-2 py-3 text-center">
            <div className="text-xl sm:text-2xl font-semibold">{profile.level}</div>
            <div className="text-[11px] sm:text-xs text-sea-light/90">уровень</div>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-2 py-3 text-center">
            <div className="text-xl sm:text-2xl font-semibold">{verifiedCount}</div>
            <div className="text-[11px] sm:text-xs text-sea-light/90">репортов</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <p className="text-xs text-sea-light/90 mt-1.5">
            До {profile.level + 1} уровня: {pointsToNextLevel} баллов
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Award size={18} className="text-sea-dark" />
          Значки
        </h2>
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

      <section className="mb-8">
        <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Gift size={18} className="text-sea-dark" />
          Мои награды
        </h2>
        {redemptions.length === 0 ? (
          <p className="text-sm text-gray-400">Вы ещё не обменивали баллы на награды.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {redemptions.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-sand-dark/20 bg-white px-3 py-2.5 text-sm shadow-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{r.rewards?.title}</div>
                  <div className="text-xs text-gray-500 truncate">{r.rewards?.partners?.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-semibold text-sea-dark">{r.promo_code}</div>
                  <div className="text-xs text-gray-400">
                    {r.status === 'used' ? 'Использован' : 'Выдан'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <FileText size={18} className="text-sea-dark" />
          История репортов
        </h2>
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
