import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gift, Store, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CITIES } from '../lib/constants'

export default function Rewards() {
  const { user, profile, refreshProfile } = useAuth()
  const [city, setCity] = useState('')
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeemingId, setRedeemingId] = useState(null)
  const [error, setError] = useState('')
  const [lastPromoCode, setLastPromoCode] = useState(null)

  useEffect(() => {
    fetchRewards()
  }, [city])

  async function fetchRewards() {
    setLoading(true)
    let query = supabase
      .from('rewards')
      .select('*, partners(name, city, logo_url)')
      .eq('active', true)
      .order('points_cost', { ascending: true })
    if (city) query = query.eq('city', city)
    const { data } = await query
    setRewards(data ?? [])
    setLoading(false)
  }

  async function handleRedeem(reward) {
    setError('')
    setLastPromoCode(null)
    setRedeemingId(reward.id)
    const { data, error } = await supabase.rpc('redeem_reward', { p_reward_id: reward.id })
    setRedeemingId(null)
    if (error) {
      setError(error.message)
      return
    }
    setLastPromoCode({ reward, code: data?.[0]?.promo_code })
    await refreshProfile()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Gift className="text-sea-dark" size={24} />
          Каталог наград
        </h1>
        {profile && (
          <span className="text-sm text-gray-500">
            У вас <span className="text-sea-dark font-semibold">{profile.points_total}</span> баллов
          </span>
        )}
      </div>

      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="rounded-md border border-sand-dark/40 px-2 py-1.5 text-sm mb-6"
      >
        <option value="">Все города</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {lastPromoCode && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Награда «{lastPromoCode.reward.title}» получена! Ваш промокод:
          </p>
          <p className="text-xl font-mono font-semibold text-green-900 mt-1">
            {lastPromoCode.code}
          </p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading && <p className="text-gray-400 text-sm">Загрузка…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rewards.map((r) => {
          const canAfford = profile && profile.points_total >= r.points_cost
          return (
            <div
              key={r.id}
              className="rounded-xl border border-sand-dark/20 bg-white p-4 flex flex-col shadow-sm hover:shadow-md"
            >
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sea to-turquoise text-white flex items-center justify-center shrink-0">
                    <Store size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-medium text-gray-900">{r.title}</h2>
                    <p className="text-xs text-gray-500">
                      {r.partners?.name} · {r.city}
                    </p>
                  </div>
                </div>
                {r.description && <p className="text-sm text-gray-600 mt-2">{r.description}</p>}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1 font-semibold text-sea-dark">
                  <Sparkles size={14} />
                  {r.points_cost} баллов
                </span>
                {user ? (
                  <button
                    onClick={() => handleRedeem(r)}
                    disabled={!canAfford || redeemingId === r.id}
                    className="rounded-md bg-gradient-to-r from-sea to-turquoise text-white text-sm px-3 py-1.5 disabled:opacity-40 disabled:grayscale"
                  >
                    {redeemingId === r.id ? 'Обмен…' : canAfford ? 'Обменять' : 'Не хватает баллов'}
                  </button>
                ) : (
                  <Link to="/login" className="text-sm text-sea-dark hover:underline">
                    Войти, чтобы обменять
                  </Link>
                )}
              </div>
            </div>
          )
        })}
        {!loading && rewards.length === 0 && (
          <p className="text-sm text-gray-400 col-span-full">Наград пока нет.</p>
        )}
      </div>
    </div>
  )
}
