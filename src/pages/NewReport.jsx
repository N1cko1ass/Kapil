import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import MapView from '../components/MapView'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { REPORT_CATEGORIES, DEFAULT_MAP_CENTER } from '../lib/constants'

export default function NewReport() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [category, setCategory] = useState(REPORT_CATEGORIES[0].value)
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [location, setLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      setPhotoFile(compressed)
      setPhotoPreview(URL.createObjectURL(compressed))
    } catch {
      setError('Не удалось обработать фото')
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается браузером')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setError('Не удалось определить геолокацию, укажите точку на карте вручную')
        setLocating(false)
      }
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!location) {
      setError('Укажите местоположение репорта на карте')
      return
    }
    if (!photoFile) {
      setError('Прикрепите фото')
      return
    }

    setSubmitting(true)

    const ext = photoFile.name?.split('.').pop() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('report-photos').upload(path, photoFile)
    if (uploadError) {
      setError('Не удалось загрузить фото: ' + uploadError.message)
      setSubmitting(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('report-photos').getPublicUrl(path)

    const { error: insertError } = await supabase.from('reports').insert({
      user_id: user.id,
      category,
      description,
      photo_url: publicUrlData.publicUrl,
      lat: location.lat,
      lng: location.lng,
      city: profile?.city ?? null,
      status: 'pending_review',
    })

    setSubmitting(false)

    if (insertError) {
      setError('Не удалось создать репорт: ' + insertError.message)
      return
    }

    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Новый репорт</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
          <div className="flex gap-2 flex-wrap">
            {REPORT_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full px-3 py-1.5 text-sm border ${
                  category === c.value
                    ? 'bg-sea text-white border-sea'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Фото</label>
          <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} />
          {photoPreview && (
            <img src={photoPreview} alt="" className="mt-2 w-40 h-40 object-cover rounded-md" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Местоположение {location && '✓'}
          </label>
          <button
            type="button"
            onClick={useMyLocation}
            className="text-sm text-sea-dark hover:underline mb-2"
          >
            {locating ? 'Определяем…' : 'Использовать моё местоположение'}
          </button>
          <p className="text-xs text-gray-400 mb-2">Или отметьте точку на карте вручную:</p>
          <MapView
            center={location ? [location.lat, location.lng] : DEFAULT_MAP_CENTER}
            onMapClick={(latlng) => setLocation(latlng)}
            pickedLocation={location}
            height="300px"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="Опишите, что вы обнаружили…"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-sea text-white py-2.5 font-medium hover:bg-sea-dark disabled:opacity-50"
        >
          {submitting ? 'Отправка…' : 'Отправить репорт'}
        </button>
      </form>
    </div>
  )
}
