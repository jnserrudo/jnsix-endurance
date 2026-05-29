import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesService } from '../services/activities.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { formatDistance, formatTime, formatDate, formatActivityType, formatPace, formatElevation } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, ReferenceLine } from 'recharts';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, Pause, RotateCcw, Compass } from 'lucide-react';

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

// React Leaflet Map center updater
const RecenterMap = ({ center, shouldRecenter }) => {
  const map = useMap();
  useEffect(() => {
    if (center && shouldRecenter) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, shouldRecenter, map]);
  return null;
};

export const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState('charts'); // 'charts' | 'map'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Estados del reproductor GPS
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [followCursor, setFollowCursor] = useState(false);
  const [coordsDistances, setCoordsDistances] = useState([]);
  const [isHoveringChart, setIsHoveringChart] = useState(false);

  // Decodificar o extraer coordenadas
  const coords = (() => {
    if (!activity) return [];
    if (activity.rawData?.coordinates && Array.isArray(activity.rawData.coordinates)) {
      return activity.rawData.coordinates;
    } else if (activity.rawData?.map?.summary_polyline) {
      return decodePolyline(activity.rawData.map.summary_polyline);
    }
    return [];
  })();

  // Obtener lapsData desde laps reales, splits de Strava o generar splits virtuales
  const lapsData = (() => {
    if (!activity) return [];
    const data = [];
    if (activity.laps && activity.laps.length > 0) {
      const isManual = activity.laps.some(l => Math.abs(l.distance - 1.0) > 0.05);
      return activity.laps.map((lap, index) => {
        const paceVal = lap.averagePace || 0;
        const distVal = lap.distance || 0;
        return {
          km: isManual ? `Vuelta ${lap.splitNum || (index + 1)}` : `${lap.splitNum || (index + 1)}`,
          distance: distVal,
          time: Math.round(paceVal * distVal * 60),
          pace: paceVal,
          elevation: lap.elevationGain || 0,
          hr: lap.averageHr || 0,
          maxHr: lap.maxHr || 0,
        };
      });
    } else if (activity.rawData?.laps && Array.isArray(activity.rawData.laps) && activity.rawData.laps.length > 0) {
      return activity.rawData.laps.map((lap, index) => {
        const distKm = (lap.distance || 0) / 1000;
        return {
          km: lap.name || `Vuelta ${index + 1}`,
          distance: distKm,
          time: Math.round(lap.moving_time || lap.elapsed_time || 0),
          pace: distKm > 0 ? (lap.moving_time || lap.elapsed_time || 0) / 60 / distKm : 0,
          elevation: lap.total_elevation_gain || 0,
          hr: lap.average_heartrate || 0,
          maxHr: lap.max_heartrate || 0,
        };
      });
    } else if (activity.rawData?.splits_metric && Array.isArray(activity.rawData.splits_metric)) {
      return activity.rawData.splits_metric.map((split, index) => {
        const distKm = (split.distance || 0) / 1000;
        return {
          km: `${split.split || (index + 1)}`,
          distance: distKm,
          time: Math.round(split.moving_time || split.elapsed_time || 0),
          pace: distKm > 0 ? (split.moving_time || split.elapsed_time || 0) / 60 / distKm : 0,
          elevation: split.elevation_difference || 0,
          hr: split.average_heartrate || 0,
          maxHr: split.average_heartrate || 0,
        };
      });
    } else if (activity.distanceKm > 0) {
      const totalDist = activity.distanceKm;
      const totalTime = activity.movingTime;
      const avgPace = totalDist > 0 ? (totalTime / 60) / totalDist : 0;
      const avgHr = activity.averageHr || 0;
      const maxHr = activity.maxHr || avgHr;
      
      const numFullKms = Math.floor(totalDist);
      const lastKmFraction = totalDist - numFullKms;
      
      for (let i = 0; i < numFullKms; i++) {
        data.push({
          km: `${i + 1}`,
          distance: 1.0,
          time: Math.round(totalTime / totalDist),
          pace: avgPace,
          elevation: activity.elevationM > 0 ? activity.elevationM / totalDist : 0,
          hr: avgHr,
          maxHr: maxHr
        });
      }
      
      if (lastKmFraction > 0.05) {
        data.push({
          km: `${numFullKms + 1}`,
          distance: lastKmFraction,
          time: Math.round((totalTime / totalDist) * lastKmFraction),
          pace: avgPace,
          elevation: activity.elevationM > 0 ? (activity.elevationM / totalDist) * lastKmFraction : 0,
          hr: avgHr,
          maxHr: maxHr
        });
      }
      return data;
    }
    return [];
  })();

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

  // Calcular distancias acumuladas para cada punto de la ruta
  useEffect(() => {
    if (coords && coords.length > 0) {
      const dists = [0];
      let accum = 0;
      for (let i = 1; i < coords.length; i++) {
        const d = calculateDistance(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
        accum += d / 1000;
        dists.push(accum);
      }
      setCoordsDistances(dists);
    } else {
      setCoordsDistances([]);
    }
  }, [coords]);

  // Timer del Reproductor GPS
  useEffect(() => {
    let timer = null;
    if (isPlaying && coords.length > 0) {
      // Paso dinámico para mantener suavidad e interactividad
      const step = Math.ceil((coords.length / 200) * playbackSpeed);
      timer = setInterval(() => {
        setPlaybackIndex((prevIndex) => {
          if (prevIndex + step >= coords.length - 1) {
            setIsPlaying(false);
            return coords.length - 1;
          }
          return prevIndex + step;
        });
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, coords.length]);

  // Sincronizar el reproductor con el hoveredIndex de los gráficos
  useEffect(() => {
    if (!isHoveringChart && coordsDistances.length > 0 && playbackIndex !== null) {
      const currentDist = coordsDistances[playbackIndex];
      const lapIdx = Math.min(lapsData.length - 1, Math.floor(currentDist));
      if (lapIdx >= 0 && lapIdx !== hoveredIndex) {
        setHoveredIndex(lapIdx);
      }
    }
  }, [playbackIndex, coordsDistances, isHoveringChart, lapsData.length, hoveredIndex]);

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

  const isGymActivity = activity.distanceKm === 0 || activity.type === 'OTHER';
  const isSwimActivity = activity.type === 'SWIM';

  const formatSwimPace = (distanceKm, timeSeconds) => {
    if (!distanceKm || !timeSeconds) return '0:00';
    const distanceM = distanceKm * 1000;
    const hundreds = distanceM / 100;
    if (hundreds === 0) return '0:00';
    const paceSeconds = timeSeconds / hundreds;
    let minutes = Math.floor(paceSeconds / 60);
    let seconds = Math.round(paceSeconds % 60);
    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Detección automática de series/intervalos en pista
  const intervalAnalysis = (() => {
    if (!lapsData || lapsData.length < 3) return null;
    if (activity.type !== 'RUN' && activity.type !== 'TRAIL_RUN') return null;
    
    const validLaps = lapsData.filter(l => l.distance > 0 && l.pace > 0);
    if (validLaps.length < 3) return null;
    
    const paces = validLaps.map(l => l.pace);
    const minPace = Math.min(...paces);
    const maxPace = Math.max(...paces);
    
    // Rango de ritmo > 30 segundos/km para calificar como intervalo
    if (maxPace - minPace < 0.5) return null;
    
    const avgPace = paces.reduce((sum, p) => sum + p, 0) / paces.length;
    
    const activeLaps = [];
    const recoveryLaps = [];
    
    validLaps.forEach(l => {
      // Si el ritmo es 2.5% más rápido que la media, es intervalo activo
      if (l.pace < avgPace * 0.975) {
        activeLaps.push(l);
      } else {
        recoveryLaps.push(l);
      }
    });
    
    if (activeLaps.length === 0 || recoveryLaps.length === 0) return null;
    
    const avgActivePace = activeLaps.reduce((sum, l) => sum + l.pace, 0) / activeLaps.length;
    const avgRecoveryPace = recoveryLaps.reduce((sum, l) => sum + l.pace, 0) / recoveryLaps.length;
    
    const formatPaceDec = (paceMinKm) => {
      let mins = Math.floor(paceMinKm);
      let secs = Math.round((paceMinKm - mins) * 60);
      if (secs === 60) { mins += 1; secs = 0; }
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    return {
      isInterval: true,
      activeCount: activeLaps.length,
      recoveryCount: recoveryLaps.length,
      avgActivePaceStr: formatPaceDec(avgActivePace),
      avgRecoveryPaceStr: formatPaceDec(avgRecoveryPace),
      activeLapsIds: new Set(activeLaps.map(l => l.km)),
    };
  })();


  const handlePlayPause = () => {
    if (playbackIndex >= coords.length - 1) {
      setPlaybackIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

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

      {/* Métricas principales adaptativas */}
      {isGymActivity ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">TIEMPO TOTAL</p>
            <p className="stat-number text-2xl lg:text-3xl text-accent-lime">{formatTime(activity.movingTime)}</p>
            <p className="text-text-secondary font-mono text-xs">H:M:S</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">CALORÍAS</p>
            <p className="stat-number text-2xl lg:text-3xl text-accent-cyan">{calories}</p>
            <p className="text-text-secondary font-mono text-xs">KCAL</p>
          </Card>

          {avgHr > 0 && (
            <Card neon className="p-4">
              <p className="label-text text-xs mb-1">FC MEDIA</p>
              <p className="stat-number text-2xl lg:text-3xl text-accent-pink">{avgHr}</p>
              <p className="text-text-secondary font-mono text-xs">BPM</p>
            </Card>
          )}

          {maxHr > 0 && (
            <Card neon className="p-4">
              <p className="label-text text-xs mb-1">FC MÁXIMA</p>
              <p className="stat-number text-2xl lg:text-3xl text-accent-pink">{maxHr}</p>
              <p className="text-text-secondary font-mono text-xs">BPM</p>
            </Card>
          )}
        </div>
      ) : isSwimActivity ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">DISTANCIA</p>
            <p className="stat-number text-2xl lg:text-3xl text-accent-cyan">{Math.round(activity.distanceKm * 1000)}</p>
            <p className="text-text-secondary font-mono text-xs">METROS</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">TIEMPO</p>
            <p className="stat-number text-2xl lg:text-3xl text-accent-lime">{formatTime(activity.movingTime)}</p>
            <p className="text-text-secondary font-mono text-xs">H:M:S</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">RITMO MEDIO</p>
            <p className="stat-number text-2xl lg:text-3xl text-accent-pink">{formatSwimPace(activity.distanceKm, activity.movingTime)}</p>
            <p className="text-text-secondary font-mono text-xs font-bold text-[10px]">MIN/100M</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">CALORÍAS</p>
            <p className="stat-number text-2xl lg:text-3xl text-accent-lime">{calories}</p>
            <p className="text-text-secondary font-mono text-xs">KCAL</p>
          </Card>

          {avgHr > 0 && (
            <Card neon className="p-4">
              <p className="label-text text-xs mb-1">FC MEDIA</p>
              <p className="stat-number text-2xl lg:text-3xl text-accent-pink">{avgHr}</p>
              <p className="text-text-secondary font-mono text-xs">BPM</p>
            </Card>
          )}
        </div>
      ) : (
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
      )}

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
                {/* Indicador de reproducción del reproductor GPS */}
                {playbackIndex < coords.length && (
                  <CircleMarker
                    center={coords[playbackIndex]}
                    radius={9}
                    fillColor="#00D4FF"
                    fillOpacity={1}
                    color="#FFFFFF"
                    weight={2}
                  />
                )}
                <ChangeMapView coords={coords} />
                <RecenterMap center={coords[playbackIndex]} shouldRecenter={followCursor} />
              </MapContainer>

              {/* Controles del Reproductor flotantes */}
              <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-panel-bg/95 backdrop-blur-md border border-border-primary p-3 rounded-lg flex flex-col gap-2 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayPause}
                      className="p-2 bg-accent-cyan hover:bg-accent-cyan/85 text-app-bg rounded-full transition-all focus:outline-none flex items-center justify-center cursor-pointer"
                      title={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                      {isPlaying ? <Pause size={14} className="fill-app-bg stroke-app-bg" /> : <Play size={14} className="fill-app-bg stroke-app-bg ml-0.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setPlaybackIndex(0);
                      }}
                      className="p-2 hover:bg-panel-bg-solid text-text-primary border border-border-primary rounded-full transition-all focus:outline-none flex items-center justify-center cursor-pointer"
                      title="Reiniciar"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => setFollowCursor(!followCursor)}
                      className={`p-2 rounded-full border transition-all focus:outline-none flex items-center justify-center cursor-pointer ${
                        followCursor
                          ? 'bg-accent-lime/20 border-accent-lime text-accent-lime'
                          : 'hover:bg-panel-bg-solid border-border-primary text-text-secondary'
                      }`}
                      title={followCursor ? 'Fijar cámara al cursor' : 'Seguir cursor con cámara'}
                    >
                      <Compass size={14} className={followCursor ? 'animate-spin-slow' : ''} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-text-secondary uppercase">Velocidad:</span>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="bg-panel-bg-solid border border-border-primary rounded px-1.5 py-1 text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-accent-cyan cursor-pointer"
                    >
                      <option value="1">1x</option>
                      <option value="2">2x</option>
                      <option value="5">5x</option>
                      <option value="10">10x</option>
                      <option value="20">20x</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-text-secondary w-14 font-semibold font-mono">
                    {coordsDistances[playbackIndex] ? `${coordsDistances[playbackIndex].toFixed(2)} km` : '0.00 km'}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={coords.length - 1}
                    value={playbackIndex}
                    onChange={(e) => setPlaybackIndex(Number(e.target.value))}
                    className="flex-1 h-1 bg-border-primary rounded-lg appearance-none cursor-pointer accent-accent-cyan focus:outline-none"
                  />
                  <span className="text-[10px] font-mono text-text-secondary w-10 text-right font-semibold font-mono">
                    {coords.length > 0 ? `${Math.round((playbackIndex / (coords.length - 1)) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
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
                          setIsHoveringChart(true);
                        }
                      }}
                      onMouseLeave={() => {
                        setIsHoveringChart(false);
                      }}
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
                      {hoveredIndex !== null && lapsData[hoveredIndex] && (
                        <ReferenceLine
                          x={lapsData[hoveredIndex].km}
                          stroke="#00D4FF"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                        />
                      )}
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
                          setIsHoveringChart(true);
                        }
                      }}
                      onMouseLeave={() => {
                        setIsHoveringChart(false);
                      }}
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
                      {hoveredIndex !== null && lapsData[hoveredIndex] && (
                        <ReferenceLine
                          x={lapsData[hoveredIndex].km}
                          stroke="#FF3A6E"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>

          {/* Análisis Especializado de Series de Pista / Intervalos */}
          {intervalAnalysis && (
            <Card neon className="p-6 border-l-4 border-accent-lime">
              <h3 className="text-sm font-mono font-bold text-accent-lime mb-3 tracking-wider uppercase">
                ANÁLISIS DE SERIES Y ENTRENAMIENTO DE PISTA
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                JNSIX AI ha detectado de forma automática una sesión fraccionada por intervalos en esta actividad, separando el esfuerzo de velocidad de los períodos de recuperación activa.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="bg-panel-bg p-3 border border-border-primary rounded">
                  <span className="block text-[9px] text-text-secondary mb-1">INTERVALOS ACTIVOS</span>
                  <span className="text-base font-bold text-accent-cyan">{intervalAnalysis.activeCount} series</span>
                </div>
                <div className="bg-panel-bg p-3 border border-border-primary rounded">
                  <span className="block text-[9px] text-text-secondary mb-1">RITMO MEDIO DE SERIES</span>
                  <span className="text-base font-bold text-accent-lime">{intervalAnalysis.avgActivePaceStr} /km</span>
                </div>
                <div className="bg-panel-bg p-3 border border-border-primary rounded">
                  <span className="block text-[9px] text-text-secondary mb-1">SERIES DE RECUPERACIÓN</span>
                  <span className="text-base font-bold text-text-primary">{intervalAnalysis.recoveryCount} vueltas</span>
                </div>
                <div className="bg-panel-bg p-3 border border-border-primary rounded">
                  <span className="block text-[9px] text-text-secondary mb-1">RITMO DE RECUPERACIÓN</span>
                  <span className="text-base font-bold text-text-secondary">{intervalAnalysis.avgRecoveryPaceStr} /km</span>
                </div>
              </div>
            </Card>
          )}

          {/* Tabla de Splits */}
          {lapsData && lapsData.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-mono font-bold text-text-primary mb-4 tracking-tight">
                {isSwimActivity 
                  ? 'DETALLE POR INTERVALO' 
                  : (activity.laps?.some(l => Math.abs(l.distance - 1.0) > 0.05) || activity.rawData?.laps?.length > 0)
                    ? 'DETALLE POR VUELTA' 
                    : 'DETALLE POR KILÓMETRO'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border-primary">
                      <th className="text-left py-2 px-2 label-text">VUELTA / KM</th>
                      <th className="text-right py-2 px-2 label-text">DISTANCIA</th>
                      <th className="text-right py-2 px-2 label-text">TIEMPO</th>
                      <th className="text-right py-2 px-2 label-text">{isSwimActivity ? 'RITMO (100M)' : 'RITMO'}</th>
                      <th className="text-right py-2 px-2 label-text">{isSwimActivity ? 'CLAVE' : 'DESNIVEL'}</th>
                      <th className="text-right py-2 px-2 label-text">FC</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lapsData.map((lap, index) => {
                      const isSwim = isSwimActivity;
                      const distanceStr = isSwim ? `${Math.round(lap.distance * 1000)} m` : `${(lap.distance || 0).toFixed(2)} km`;
                      const paceStr = isSwim ? formatSwimPace(lap.distance, lap.time) : formatPace(lap.distance || 0, lap.time || 0);
                      
                      // Clasificación visual de series
                      const isActive = intervalAnalysis?.activeLapsIds.has(lap.km);
                      const lapBadge = intervalAnalysis ? (isActive ? 'SERIE' : 'RECUP.') : null;
                      
                      return (
                        <tr
                          key={index}
                          className={`border-b border-border-primary hover:bg-panel-bg/50 transition-all ${
                            hoveredIndex === index ? 'bg-accent-cyan/15 border-l-2 border-accent-cyan' : ''
                          }`}
                        >
                          <td className="py-2 px-2 text-accent-pace font-bold flex items-center gap-2">
                            <span>{lap.km}</span>
                            {lapBadge && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                                isActive ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30' : 'bg-panel-bg-solid text-text-secondary border border-border-primary'
                              }`}>
                                {lapBadge}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right text-text-primary">{distanceStr}</td>
                          <td className="py-2 px-2 text-right text-text-primary">{formatTime(lap.time || 0)}</td>
                          <td className="py-2 px-2 text-right text-accent-cyan">{paceStr}</td>
                          <td className="py-2 px-2 text-right text-accent-gold">
                            {isSwim ? 'Estilo' : `${formatElevation(lap.elevation || 0)} m`}
                          </td>
                          <td className="py-2 px-2 text-right text-accent-pink">{lap.hr ? Math.round(lap.hr) : '-'}</td>
                        </tr>
                      );
                    })}
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
                  {lapsData.length > 0 && Math.min(...lapsData.filter(d => d.pace > 0).map(d => d.pace)) !== Infinity
                    ? formatPace(1, Math.min(...lapsData.filter(d => d.pace > 0).map(d => d.pace)) * 60)
                    : '-'}
                </p>
              </div>
              <div className="p-3 bg-panel-bg/50 border border-border-primary rounded">
                <p className="label-text text-[10px] mb-1">RITMO PEOR</p>
                <p className="font-mono text-base font-bold text-accent-pink">
                  {lapsData.length > 0 && Math.max(...lapsData.filter(d => d.pace > 0).map(d => d.pace)) !== -Infinity
                    ? formatPace(1, Math.max(...lapsData.filter(d => d.pace > 0).map(d => d.pace)) * 60)
                    : '-'}
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
                  {activity.averageHr ? Math.round(activity.averageHr) : (lapsData.some(d => d.hr > 0) ? Math.round(lapsData.reduce((sum, d) => sum + d.hr, 0) / lapsData.filter(d => d.hr > 0).length) : '-')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
