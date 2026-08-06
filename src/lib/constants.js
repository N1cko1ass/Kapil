export const REPORT_CATEGORIES = [
  { value: 'litter', label: 'Мусор', color: '#f59e0b', points: 10 },
  { value: 'oil', label: 'Нефть / промышленное загрязнение', color: '#1f2937', points: 30 },
  { value: 'wildlife', label: 'Дикая природа / браконьерство', color: '#16a34a', points: 40 },
]

export const REPORT_STATUSES = [
  { value: 'pending_review', label: 'На проверке', color: '#f59e0b' },
  { value: 'verified', label: 'Подтверждён', color: '#16a34a' },
  { value: 'rejected', label: 'Отклонён', color: '#dc2626' },
]

export function categoryLabel(value) {
  return REPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export function statusLabel(value) {
  return REPORT_STATUSES.find((s) => s.value === value)?.label ?? value
}

// Актау — центр карты по умолчанию
export const DEFAULT_MAP_CENTER = [43.6481, 51.1801]
export const DEFAULT_MAP_ZOOM = 12

export const CITIES = ['Актау', 'Атырау']

export const EVENT_STATUSES = [
  { value: 'planned', label: 'Запланирована', color: '#0e7490' },
  { value: 'active', label: 'Идёт сейчас', color: '#16a34a' },
  { value: 'completed', label: 'Завершена', color: '#6b7280' },
  { value: 'cancelled', label: 'Отменена', color: '#dc2626' },
]

export function eventStatusLabel(value) {
  return EVENT_STATUSES.find((s) => s.value === value)?.label ?? value
}

export function eventTypeLabel(value) {
  return value === 'official' ? 'Официальная' : 'Пользовательская'
}
