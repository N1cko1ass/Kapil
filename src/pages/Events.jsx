import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CITIES, eventStatusLabel, eventTypeLabel, DEFAULT_MAP_CENTER } from '../lib/constants'
import MapView from '../components/MapView'

const EMPTY_FORM = {
  title: '',
  description: '',
  city: CITIES[0],
  date_time: '',
  type: 'user',
}

export default function Events() {
  const { user, profile } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date_time', { ascending: true })
    setEvents(data ?? [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!location) {
      setError('Отметьте место проведения на карте')
      return
    }
    const { error } = await supabase.from('events').insert({
      ...form,
      creator_id: user.id,
      lat: location.lat,
      lng: location.lng,
      status: 'planned',
    })
    if (error) {
      setError(error.message)
      return
    }
    setShowForm(false)
    setForm(EMPTY_FORM)
    setLocation(null)
    await load()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Акции и уборки</h1>
        {user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-sea text-white px-4 py-2 text-sm font-medium hover:bg-sea-dark"
          >
            {showForm ? 'Отмена' : '+ Создать акцию'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg border border-gray-200 p-4 mb-8 flex flex-col gap-3">
          <input
            required
            placeholder="Название акции"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <textarea
            placeholder="Описание"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          <div className="flex gap-3">
            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              required
              type="datetime-local"
              value={form.date_time}
              onChange={(e) => setForm({ ...form, date_time: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 flex-1"
            />
            {profile?.role === 'admin' && (
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="user">Пользовательская</option>
                <option value="official">Официальная</option>
              </select>
            )}
          </div>
          <p className="text-xs text-gray-400">Отметьте место проведения на карте:</p>
          <MapView
            center={DEFAULT_MAP_CENTER}
            onMapClick={(latlng) => setLocation(latlng)}
            pickedLocation={location}
            height="250px"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="rounded-md bg-sea text-white py-2 font-medium hover:bg-sea-dark"
          >
            Создать акцию
          </button>
        </form>
      )}

      {loading && <p className="text-gray-400 text-sm">Загрузка…</p>}

      <div className="flex flex-col gap-2">
        {events.map((ev) => (
          <Link
            key={ev.id}
            to={`/events/${ev.id}`}
            className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-sea"
          >
            <div>
              <div className="font-medium text-gray-900">{ev.title}</div>
              <div className="text-xs text-gray-500">
                {eventTypeLabel(ev.type)} · {ev.city} ·{' '}
                {new Date(ev.date_time).toLocaleString('ru-RU')}
              </div>
            </div>
            <span className="text-xs text-gray-400">{eventStatusLabel(ev.status)}</span>
          </Link>
        ))}
        {!loading && events.length === 0 && (
          <p className="text-sm text-gray-400">Акций пока нет.</p>
        )}
      </div>
    </div>
  )
}
