import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, categoryLabel, statusLabel, REPORT_CATEGORIES } from '../lib/constants'

function categoryIcon(category) {
  const color = REPORT_CATEGORIES.find((c) => c.value === category)?.color ?? '#0e7490'
  return L.divIcon({
    className: '',
    html: `<span style="background:${color}" class="block w-4 h-4 rounded-full border-2 border-white shadow"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng)
    },
  })
  return null
}

export default function MapView({
  reports = [],
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  onMapClick,
  pickedLocation,
  height = '400px',
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      className="rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      {reports.map(
        (r) =>
          r.lat != null &&
          r.lng != null && (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={categoryIcon(r.category)}>
              <Popup>
                <div className="text-sm">
                  <div className="font-medium">{categoryLabel(r.category)}</div>
                  <div className="text-gray-500">{statusLabel(r.status)}</div>
                  {r.description && <p className="mt-1">{r.description}</p>}
                </div>
              </Popup>
            </Marker>
          )
      )}
      {pickedLocation && (
        <Marker position={[pickedLocation.lat, pickedLocation.lng]} />
      )}
    </MapContainer>
  )
}
