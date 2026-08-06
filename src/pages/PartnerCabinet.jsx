import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CITIES } from '../lib/constants'

const EMPTY_FORM = { title: '', description: '', points_cost: 100, city: CITIES[0], active: true }

export default function PartnerCabinet() {
  const { user, profile } = useAuth()
  const [partner, setPartner] = useState(null)
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [partnerForm, setPartnerForm] = useState({ name: '', city: CITIES[0], contact: '' })
  const [rewardForm, setRewardForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    const { data: partnerRow } = await supabase
      .from('partners')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle()
    setPartner(partnerRow)
    if (partnerRow) {
      const { data } = await supabase
        .from('rewards')
        .select('*')
        .eq('partner_id', partnerRow.id)
        .order('created_at', { ascending: false })
      setRewards(data ?? [])
    }
    setLoading(false)
  }

  async function handleCreatePartner(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase
      .from('partners')
      .insert({ ...partnerForm, owner_user_id: user.id })
    if (error) {
      setError(error.message)
      return
    }
    await load()
  }

  function startEdit(reward) {
    setEditingId(reward.id)
    setRewardForm({
      title: reward.title,
      description: reward.description ?? '',
      points_cost: reward.points_cost,
      city: reward.city ?? CITIES[0],
      active: reward.active,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setRewardForm(EMPTY_FORM)
  }

  async function handleSubmitReward(e) {
    e.preventDefault()
    setError('')
    const payload = { ...rewardForm, points_cost: Number(rewardForm.points_cost) }

    const { error } = editingId
      ? await supabase.from('rewards').update(payload).eq('id', editingId)
      : await supabase.from('rewards').insert({ ...payload, partner_id: partner.id })

    if (error) {
      setError(error.message)
      return
    }
    cancelEdit()
    await load()
  }

  async function toggleActive(reward) {
    await supabase.from('rewards').update({ active: !reward.active }).eq('id', reward.id)
    await load()
  }

  async function deleteReward(reward) {
    if (!confirm(`Удалить награду «${reward.title}»?`)) return
    await supabase.from('rewards').delete().eq('id', reward.id)
    await load()
  }

  if (!profile) return <p className="p-8 text-center text-gray-400">Загрузка…</p>

  if (profile.role !== 'partner') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center text-gray-500">
        Кабинет партнёра доступен только аккаунтам с ролью «partner». Обратитесь к
        администратору, чтобы назначить роль вашему аккаунту.
      </div>
    )
  }

  if (loading) return <p className="p-8 text-center text-gray-400">Загрузка…</p>

  if (!partner) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Профиль партнёра</h1>
        <p className="text-sm text-gray-500 mb-6">
          У вашего аккаунта ещё нет карточки партнёра — создайте её, чтобы добавлять награды.
        </p>
        <form onSubmit={handleCreatePartner} className="flex flex-col gap-3">
          <input
            required
            placeholder="Название компании"
            value={partnerForm.name}
            onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <select
            value={partnerForm.city}
            onChange={(e) => setPartnerForm({ ...partnerForm, city: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            placeholder="Контакт (телефон/email)"
            value={partnerForm.contact}
            onChange={(e) => setPartnerForm({ ...partnerForm, contact: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="rounded-md bg-sea text-white py-2 font-medium hover:bg-sea-dark"
          >
            Создать
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">{partner.name}</h1>
      <p className="text-sm text-gray-500 mb-8">{partner.city}</p>

      <form
        onSubmit={handleSubmitReward}
        className="rounded-lg border border-gray-200 p-4 mb-8 flex flex-col gap-3"
      >
        <h2 className="font-medium text-gray-900">
          {editingId ? 'Редактировать награду' : 'Новая награда'}
        </h2>
        <input
          required
          placeholder="Название"
          value={rewardForm.title}
          onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        <textarea
          placeholder="Описание"
          rows={2}
          value={rewardForm.description}
          onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
        <div className="flex gap-3">
          <input
            type="number"
            min={1}
            required
            placeholder="Стоимость в баллах"
            value={rewardForm.points_cost}
            onChange={(e) => setRewardForm({ ...rewardForm, points_cost: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2 flex-1"
          />
          <select
            value={rewardForm.city}
            onChange={(e) => setRewardForm({ ...rewardForm, city: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-sea text-white px-4 py-2 text-sm font-medium hover:bg-sea-dark"
          >
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm"
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      <h2 className="font-medium text-gray-900 mb-3">Мои награды</h2>
      <div className="flex flex-col gap-2">
        {rewards.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
          >
            <div>
              <div className="font-medium text-gray-900">
                {r.title}{' '}
                {!r.active && <span className="text-xs text-gray-400">(скрыто)</span>}
              </div>
              <div className="text-xs text-gray-500">
                {r.points_cost} баллов · {r.city}
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <button onClick={() => toggleActive(r)} className="text-sea-dark hover:underline">
                {r.active ? 'Скрыть' : 'Показать'}
              </button>
              <button onClick={() => startEdit(r)} className="text-sea-dark hover:underline">
                Изменить
              </button>
              <button onClick={() => deleteReward(r)} className="text-red-600 hover:underline">
                Удалить
              </button>
            </div>
          </div>
        ))}
        {rewards.length === 0 && (
          <p className="text-sm text-gray-400">Пока нет наград — добавьте первую выше.</p>
        )}
      </div>
    </div>
  )
}
