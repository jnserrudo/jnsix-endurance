import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesService } from '../services/activities.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { formatDistance, formatTime, formatDate, formatActivityType, formatPace, formatElevation } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Polyline decoder
const decodePolyline = (str, precision = 5) => {
  let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null,
    latitude_change, longitude_change, factor = Math.pow(10, precision);

  while (index < str.length) {
    byte = null; shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = 0; result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    lat += latitude_change;
    lng += longitude_change;
    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
};

// Calculate Haversine distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find coordinate corresponding to a cumulative distance in km along the path
const getCoordinateForDistance = (distanceKm, coords) => {
  if (!coords || coords.length === 0) return null;
  if (distanceKm <= 0) return coords[0];

  let cumulative = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = calculateDistance(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    cumulative += d / 1000;
    if (cumulative >= distanceKm) {
      return coords[i];
    }
  }
  return coords[coords.length - 1];
};

// React Leaflet Map bounds updater
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [coords, map]);
  return null;
};

export const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState('charts'); // 'charts' | 'map'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await activitiesService.getActivityById(id);
        setActivity(data);
      } catch (error) {
        toast.error('Error al cargar la actividad');
        navigate('/activities');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!activity) return null;

  const speed = activity.movingTime > 0 ? activity.distanceKm / (activity.movingTime / 3600) : 0;
  const elevationGain = activity.elevationM || 0;
  const calories = activity.calories || 0;
  const avgHr = activity.averageHr || 0;
  const maxHr = activity.maxHr || 0;
  const intensity = maxHr > 0 ? Math.round((avgHr / maxHr) * 100) : 0;

  const lapsData = activity.laps?.map((lap, index) => ({
    km: index + 1,
    distance: lap.distance || 0,
    time: lap.movingTime || 0,
    pace: lap.distance > 0 ? (lap.movingTime / 60) / (lap.distance / 1000) : 0,
    elevation: lap.elevationGain || 0,
    hr: lap.averageHr || 0,
    maxHr: lap.maxHr || 0,
  })) || [];

  // Decodificar o extraer coordenadas
  let coords = [];
  if (activity.rawData?.coordinates && Array.isArray(activity.rawData.coordinates)) {
    coords = activity.rawData.coordinates;
  } else if (activity.rawData?.map?.summary_polyline) {
    coords = decodePolyline(activity.rawData.map.summary_polyline);
  }

  // Coordenada del punto interactivo
  const hoveredCoord = hoveredIndex !== null && coords.length > 0
    ? getCoordinateForDistance(hoveredIndex + 1, coords)
    : null;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-accent-pace/20 text-accent-pace font-mono font-bold text-sm border border-accent-pace">
              {formatActivityType(activity.type)}
            </span>
            <span className="text-text-secondary font-mono text-sm">
              {formatDate(activity.startDate)}
            </span>
            <span className="text-text-secondary font-mono text-sm">
              {new Date(activity.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-mono font-bold text-accent-cyan mb-2">
            {activity.name || 'Sin título'}
          </h1>
          {activity.description && (
            <p className="text-text-secondary font-mono text-sm max-w-2xl">
              {activity.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => navigate(`/ai-analysis?activityId=${id}`)}>
            ANÁLISIS IA
          </Button>
          <Button variant="secondary" onClick={() => navigate('/activities')}>
            VOLVER
          </Button>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">DISTANCIA</p>
          <p className="stat-number text-2xl lg:text-3xl text-accent-cyan">{formatDistance(activity.distanceKm * 1000)}</p>
          <p className="text-text-secondary font-mono text-xs">KM</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">TIEMPO</p>
          <p className="stat-number text-2xl lg:text-3xl text-accent-lime">{formatTime(activity.movingTime)}</p>
          <p className="text-text-secondary font-mono text-xs">H:M:S</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">RITMO</p>
          <p className="stat-number text-2xl lg:text-3xl text-accent-pink">{formatPace(activity.distanceKm, activity.movingTime)}</p>
          <p className="text-text-secondary font-mono text-xs">MIN/KM</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">VELOCIDAD</p>
          <p className="stat-number text-2xl lg:text-3xl text-accent-cyan">{speed.toFixed(1)}</p>
          <p className="text-text-secondary font-mono text-xs">KM/H</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">DESNIVEL +</p>
          <p className="stat-number text-2xl lg:text-3xl text-accent-gold">{formatElevation(elevationGain)}</p>
          <p className="text-text-secondary font-mono text-xs">M</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">CALORÍAS</p>
          <p className="stat-number text-2xl lg:text-3xl text-accent-lime">{calories}</p>
          <p className="text-text-secondary font-mono text-xs">KCAL</p>
        </Card>
      </div>

      {/* Métricas de FC */}
      {avgHr > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">FC MEDIA</p>
            <p className="stat-number text-2xl text-accent-pink">{avgHr}</p>
            <p className="text-text-secondary font-mono text-xs">BPM</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">FC MÁXIMA</p>
            <p className="stat-number text-2xl text-accent-pink">{maxHr}</p>
            <p className="text-text-secondary font-mono text-xs">BPM</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">INTENSIDAD</p>
            <p className="stat-number text-2xl text-accent-cyan">{intensity}%</p>
            <p className="text-text-secondary font-mono text-xs">FCMAX</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">ZONA PRINCIPAL</p>
            <p className="stat-number text-xl text-accent-gold">
              {intensity < 60 ? 'Z1' : intensity < 70 ? 'Z2' : intensity < 80 ? 'Z3' : intensity < 90 ? 'Z4' : 'Z5'}
            </p>
            <p className="text-text-secondary font-mono text-xs">HR ZONE</p>
          </Card>
        </div>
      )}

      {/* Selector de pestañas para móvil (oculto en pantallas grandes) */}
      <div className="flex gap-2 lg:hidden">
        <button
          onClick={() => setActiveMobileTab('charts')}
          className={`flex-1 py-3 px-4 text-center font-mono text-xs font-bold tracking-tight rounded border transition-all ${
            activeMobileTab === 'charts'
              ? 'bg-accent-cyan border-accent-cyan text-app-bg'
              : 'bg-panel-bg border-border-primary text-text-primary'
          }`}
        >
          MÉTRICAS Y GRÁFICOS
        </button>
        {coords.length > 0 && (
          <button
            onClick={() => setActiveMobileTab('map')}
            className={`flex-1 py-3 px-4 text-center font-mono text-xs font-bold tracking-tight rounded border transition-all ${
              activeMobileTab === 'map'
                ? 'bg-accent-cyan border-accent-cyan text-app-bg'
                : 'bg-panel-bg border-border-primary text-text-primary'
            }`}
          >
            MAPA DE LA RUTA
          </button>
        )}
      </div>

      {/* Grilla Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa de Ruta */}
        {coords.length > 0 && (
          <div className={`lg:col-span-5 ${activeMobileTab === 'map' ? 'block' : 'hidden lg:block'}`}>
            <Card className="h-[350px] lg:h-[550px] relative overflow-hidden p-0 border border-border-primary rounded-lg">
              <MapContainer
                style={{ height: '100%', width: '100%', background: '#1A1F2E' }}
                zoom={13}
                center={coords[0]}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <Polyline
                  positions={coords}
                  color="#00D4FF"
                  weight={4}
                  opacity={0.8}
                />
                {/* Inicio de Ruta */}
                <CircleMarker
                  center={coords[0]}
                  radius={6}
                  fillColor="#B5FF3A"
                  fillOpacity={1}
                  color="#1A1F2E"
                  weight={2}
                />
                {/* Fin de Ruta */}
                <CircleMarker
                  center={coords[coords.length - 1]}
                  radius={6}
                  fillColor="#FF2A5F"
                  fillOpacity={1}
                  color="#1A1F2E"
                  weight={2}
                />
                {/* Indicador interactivo al hacer hover */}
                {hoveredCoord && (
                  <CircleMarker
                    center={hoveredCoord}
                    radius={8}
                    fillColor="#00D4FF"
                    fillOpacity={0.9}
                    color="#FFFFFF"
                    weight={2}
                    className="animate-pulse"
                  />
                )}
                <ChangeMapView coords={coords} />
              </MapContainer>
            </Card>
          </div>
        )}

        {/* Gráficos y Tablas */}
        <div className={`lg:col-span-7 space-y-6 ${activeMobileTab === 'charts' ? 'block' : 'hidden lg:block'}`}>
          <div className="grid grid-cols-1 gap-6">
            {/* Gráfico de Ritmo */}
            {lapsData.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-mono font-bold text-text-primary mb-4 tracking-tight">RITMO POR KILÓMETRO</h3>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={lapsData}
                      onMouseMove={(state) => {
                        if (state && state.activeTooltipIndex !== undefined) {
                          setHoveredIndex(state.activeTooltipIndex);
                        }
                      }}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="km"
                        stroke="#8B92A5"
                        style={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                      />
                      <YAxis
                        stroke="#8B92A5"
                        style={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#151A23',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#E8EAED',
                          fontFamily: 'JetBrains Mono',
                          fontSize: '12px',
                          borderRadius: '4px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="pace"
                        stroke="#00E5FF"
                        fill="#00E5FF"
                        fillOpacity={0.15}
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Gráfico de FC */}
            {lapsData.some(d => d.hr > 0) && (
              <Card className="p-4">
                <h3 className="text-sm font-mono font-bold text-text-primary mb-4 tracking-tight">FRECUENCIA CARDÍACA</h3>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={lapsData}
                      onMouseMove={(state) => {
                        if (state && state.activeTooltipIndex !== undefined) {
                          setHoveredIndex(state.activeTooltipIndex);
                        }
                      }}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="km"
                        stroke="#8B92A5"
                        style={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                      />
                      <YAxis
                        stroke="#8B92A5"
                        style={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#151A23',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#E8EAED',
                          fontFamily: 'JetBrains Mono',
                          fontSize: '12px',
                          borderRadius: '4px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="hr"
                        stroke="#FF3A6E"
                        fill="#FF3A6E"
                        fillOpacity={0.15}
                        strokeWidth={3}
                        name="FC Media"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>

          {/* Tabla de Splits */}
          {activity.laps && activity.laps.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-mono font-bold text-text-primary mb-4 tracking-tight">DETALLE POR KILÓMETRO</h3>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border-primary">
                      <th className="text-left py-2 px-2 label-text">KM</th>
                      <th className="text-right py-2 px-2 label-text">DISTANCIA</th>
                      <th className="text-right py-2 px-2 label-text">TIEMPO</th>
                      <th className="text-right py-2 px-2 label-text">RITMO</th>
                      <th className="text-right py-2 px-2 label-text">DESNIVEL</th>
                      <th className="text-right py-2 px-2 label-text">FC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.laps.map((lap, index) => (
                      <tr key={index} className="border-b border-border-primary hover:bg-panel-bg/50">
                        <td className="py-2 px-2 text-accent-pace font-bold">{index + 1}</td>
                        <td className="py-2 px-2 text-right text-text-primary">{formatDistance(lap.distance || 0)} km</td>
                        <td className="py-2 px-2 text-right text-text-primary">{formatTime(lap.movingTime || 0)}</td>
                        <td className="py-2 px-2 text-right text-accent-cyan">{formatPace((lap.distance || 0) / 1000, lap.movingTime || 0)}</td>
                        <td className="py-2 px-2 text-right text-accent-gold">{formatElevation(lap.elevationGain || 0)} m</td>
                        <td className="py-2 px-2 text-right text-accent-pink">{lap.averageHr ? Math.round(lap.averageHr) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Resumen estadístico */}
          <Card className="p-4">
            <h3 className="text-sm font-mono font-bold text-text-primary mb-4 tracking-tight">RESUMEN ESTADÍSTICO</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-panel-bg/50 border border-border-primary rounded">
                <p className="label-text text-[10px] mb-1">RITMO MEJOR</p>
                <p className="font-mono text-base font-bold text-accent-cyan">
                  {lapsData.length > 0 ? formatPace(1, Math.min(...lapsData.map(d => d.time))) : '-'}
                </p>
              </div>
              <div className="p-3 bg-panel-bg/50 border border-border-primary rounded">
                <p className="label-text text-[10px] mb-1">RITMO PEOR</p>
                <p className="font-mono text-base font-bold text-accent-pink">
                  {lapsData.length > 0 ? formatPace(1, Math.max(...lapsData.map(d => d.time))) : '-'}
                </p>
              </div>
              <div className="p-3 bg-panel-bg/50 border border-border-primary rounded">
                <p className="label-text text-[10px] mb-1">KM MÁS RÁPIDO</p>
                <p className="font-mono text-base font-bold text-accent-lime">
                  {lapsData.length > 0 ? lapsData.reduce((min, d) => d.pace < min.pace ? d : min, lapsData[0])?.km : '-'}
                </p>
              </div>
              <div className="p-3 bg-panel-bg/50 border border-border-primary rounded">
                <p className="label-text text-[10px] mb-1">FC PROMEDIO</p>
                <p className="font-mono text-base font-bold text-accent-pink">
                  {lapsData.some(d => d.hr > 0) ? Math.round(lapsData.reduce((sum, d) => sum + d.hr, 0) / lapsData.filter(d => d.hr > 0).length) : '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
