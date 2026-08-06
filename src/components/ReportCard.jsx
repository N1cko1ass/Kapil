import { Link } from 'react-router-dom'
import { categoryLabel, statusLabel } from '../lib/constants'

const STATUS_STYLES = {
  pending_review: 'bg-amber-100 text-amber-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function ReportCard({ report }) {
  return (
    <Link
      to={`/reports/${report.id}`}
      className="flex gap-3 rounded-lg border border-gray-200 p-3 hover:border-sea transition-colors"
    >
      {report.photo_url ? (
        <img
          src={report.photo_url}
          alt=""
          className="w-16 h-16 rounded-md object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-md bg-gray-100 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-900">{categoryLabel(report.category)}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[report.status] ?? ''}`}>
            {statusLabel(report.status)}
          </span>
        </div>
        {report.description && (
          <p className="text-sm text-gray-500 truncate">{report.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(report.created_at).toLocaleDateString('ru-RU')}
        </p>
      </div>
    </Link>
  )
}
