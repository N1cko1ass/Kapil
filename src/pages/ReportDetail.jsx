import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { categoryLabel, statusLabel } from '../lib/constants'
import MapView from '../components/MapView'

export default function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
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

      <MapView reports={[report]} center={[report.lat, report.lng]} zoom={14} height="300px" />
    </div>
  )
}
