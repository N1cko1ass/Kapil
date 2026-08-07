import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { eventStatusLabel, eventTypeLabel } from '../lib/constants'
import MapView from '../components/MapView'

const MODERATOR_ROLES = ['moderator', 'admin']

export default function EventDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const [event, setEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [eventRes, participantsRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase
        .from('event_participants')
        .select('*, users(name)')
        .eq('event_id', id)
        .order('created_at', { ascending: true }),
    ])
    setEvent(eventRes.data)
    setParticipants(participantsRes.data ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const myParticipation = participants.find((p) => p.user_id === user?.id)
  const isCreatorOrStaff =
    user && (event?.creator_id === user.id || MODERATOR_ROLES.includes(profile?.role))
  const isStaff = profile && MODERATOR_ROLES.includes(profile.role)

  async function handleJoin() {
    setBusy(true)
    setError('')
    const { error } = await supabase
      .from('event_participants')
      .insert({ event_id: id, user_id: user.id, status: 'joined' })
    setBusy(false)
    if (error) {
      setError('Не удалось присоединиться: ' + error.message)
      return
    }
    await load()
  }

  async function handlePhotoUpload(field, file) {
    if (!file || !myParticipation) return
    setBusy(true)
    setError('')
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      const path = `${id}/${user.id}/${field}-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(path, compressed)
      if (uploadError) throw uploadError
      const { data: publicUrlData } = supabase.storage.from('event-photos').getPublicUrl(path)
      const { error: updateError } = await supabase
        .from('event_participants')
        .update({ [field]: publicUrlData.publicUrl })
        .eq('id', myParticipation.id)
      if (updateError) throw updateError
      await load()
    } catch (err) {
      setError('Не удалось загрузить фото: ' + err.message)
    }
    setBusy(false)
  }

  async function confirmParticipant(participantId) {
    setBusy(true)
    await supabase.from('event_participants').update({ status: 'confirmed' }).eq('id', participantId)
    await load()
    setBusy(false)
  }

  async function markCompleted() {
    setBusy(true)
    await supabase.from('events').update({ status: 'completed' }).eq('id', id)
    await load()
    setBusy(false)
  }

  if (loading) return <p className="p-8 text-center text-gray-400">Загрузка…</p>
  if (!event)
    return (
      <div className="p-8 text-center text-gray-500">
        Акция не найдена. <Link to="/events" className="text-sea-dark hover:underline">К списку акций</Link>
      </div>
    )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/events" className="text-sm text-sea-dark hover:underline">
        ← Назад к акциям
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-1">{event.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {eventTypeLabel(event.type)} · {eventStatusLabel(event.status)} · {event.city} ·{' '}
        {new Date(event.date_time).toLocaleString('ru-RU')}
      </p>

      {event.description && <p className="text-gray-700 mb-4">{event.description}</p>}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {event.lat != null && (
        <MapView center={[event.lat, event.lng]} zoom={14} height="250px" />
      )}

      <div className="mt-6 flex flex-col gap-4">
        {user && !myParticipation && event.status !== 'completed' && event.status !== 'cancelled' && (
          <button
            onClick={handleJoin}
            disabled={busy}
            className="self-start rounded-md bg-sea text-white px-4 py-2 text-sm font-medium hover:bg-sea-dark disabled:opacity-50"
          >
            Присоединиться
          </button>
        )}

        {myParticipation && (
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Ваше участие: {myParticipation.status === 'confirmed' ? 'подтверждено ✓' : 'ожидает подтверждения'}
            </p>
            {myParticipation.status === 'joined' && (
              <div className="flex flex-col sm:flex-row gap-4 text-sm">
                <label className="flex flex-col gap-1">
                  Фото «до»
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload('before_photo_url', e.target.files?.[0])}
                  />
                  {myParticipation.before_photo_url && (
                    <img src={myParticipation.before_photo_url} alt="" className="w-24 h-24 object-cover rounded-md" />
                  )}
                </label>
                <label className="flex flex-col gap-1">
                  Фото «после»
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload('after_photo_url', e.target.files?.[0])}
                  />
                  {myParticipation.after_photo_url && (
                    <img src={myParticipation.after_photo_url} alt="" className="w-24 h-24 object-cover rounded-md" />
                  )}
                </label>
              </div>
            )}
            {myParticipation.points_awarded > 0 && (
              <p className="text-sea-dark font-medium mt-2">+{myParticipation.points_awarded} баллов</p>
            )}
          </div>
        )}

        <div>
          <h2 className="font-medium text-gray-900 mb-2">
            Участники ({participants.length})
          </h2>
          <div className="flex flex-col gap-1">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm rounded-md border border-gray-200 px-3 py-2"
              >
                <span>{p.users?.name ?? 'Участник'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {p.status === 'confirmed' ? 'подтверждено' : 'на проверке'}
                  </span>
                  {isStaff && p.status === 'joined' && (
                    <button
                      onClick={() => confirmParticipant(p.id)}
                      disabled={busy}
                      className="text-xs rounded-md bg-green-600 text-white px-2 py-1 hover:bg-green-700 disabled:opacity-50"
                    >
                      Подтвердить
                    </button>
                  )}
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-sm text-gray-400">Пока никто не присоединился.</p>
            )}
          </div>
        </div>

        {isCreatorOrStaff && event.status !== 'completed' && event.status !== 'cancelled' && (
          <button
            onClick={markCompleted}
            disabled={busy}
            className="self-start rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Завершить акцию
          </button>
        )}
      </div>
    </div>
  )
}
