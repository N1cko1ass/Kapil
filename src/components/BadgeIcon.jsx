export default function BadgeIcon({ badge }) {
  return (
    <div
      title={badge.description ?? badge.name}
      className="flex flex-col items-center gap-1 w-20 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-sea/10 flex items-center justify-center text-2xl">
        {badge.icon ?? '🏅'}
      </div>
      <span className="text-xs text-gray-600 leading-tight">{badge.name}</span>
    </div>
  )
}
