import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { categoryLabel, statusLabel } from '../lib/constants'
import MapView from '../components/MapView'
import { useAuth } from '../context/AuthContext'

const MODERATOR_ROLES = ['moderator', 'admin']

export default function ReportDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [moderating, setModerating] = useState(false)

  const fetchReport = useCallback(() => {
    return supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        setReport(data)
        setError(error)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  async function handleModerate(status) {
    setModerating(true)
    await supabase.from('reports').update({ status }).eq('id', id)
    await fetchReport()
    setModerating(false)
  }

  if (loading) return <p className="p-8 text-center text-gray-400">Загрузка…</p>
  if (error || !report)
    return (
      <div className="p-8 text-center text-gray-500">
        Репорт не найден. <Link to="/" className="text-sea-dark hover:underline">На главную</Link>
      </div>
    )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-sea-dark hover:underline">
        ← Назад к карте
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-1">
        {categoryLabel(report.category)}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {statusLabel(report.status)} · {new Date(report.created_at).toLocaleString('ru-RU')}
      </p>

      {report.photo_url && (
        <img src={report.photo_url} alt="" className="w-full max-h-96 object-cover rounded-lg mb-4" />
      )}

      {report.description && <p className="text-gray-700 mb-4">{report.description}</p>}

      {report.points_awarded > 0 && (
        <p className="text-sea-dark font-medium mb-4">+{report.points_awarded} баллов</p>
      )}

      {profile && MODERATOR_ROLES.includes(profile.role) && report.status === 'pending_review' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700 mb-2">
            Быстрая модерация (временная — полная очередь появится в панели модерации)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleModerate('verified')}
              disabled={moderating}
              className="rounded-md bg-green-600 text-white text-sm px-3 py-1.5 hover:bg-green-700 disabled:opacity-50"
            >
              Подтвердить
            </button>
            <button
              onClick={() => handleModerate('rejected')}
              disabled={moderating}
              className="rounded-md bg-red-600 text-white text-sm px-3 py-1.5 hover:bg-red-700 disabled:opacity-50"
            >
              Отклонить
            </button>
          </div>
        </div>
      )}

      <MapView reports={[report]} center={[report.lat, report.lng]} zoom={14} height="300px" />
    </div>
  )
}
