import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesService } from '../services/activities.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { formatDistance, formatTime, formatDate, formatActivityType, formatPace, formatElevation } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';

export const ActivityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const pace = activity.distanceKm > 0 ? activity.movingTime / 60 / activity.distanceKm : 0;
  const speed = activity.movingTime > 0 ? activity.distanceKm / (activity.movingTime / 3600) : 0;
  const elevationGain = activity.elevationM || 0;
  const elevationLoss = activity.elevationM || 0;
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

  const hrZones = [
    { zone: 'Z1 Recuperación', min: 0, max: maxHr * 0.6, color: '#00E5FF' },
    { zone: 'Z2 Aeróbico', min: maxHr * 0.6, max: maxHr * 0.7, color: '#00FF94' },
    { zone: 'Z3 Tempo', min: maxHr * 0.7, max: maxHr * 0.8, color: '#FFD700' },
    { zone: 'Z4 Umbral', min: maxHr * 0.8, max: maxHr * 0.9, color: '#FF6B35' },
    { zone: 'Z5 VO2max', min: maxHr * 0.9, max: maxHr, color: '#FF3A6E' },
  ];

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
          <h1 className="text-3xl lg:text-4xl font-mono font-bold neon-text-cyan mb-2">
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
          <p className="stat-number text-2xl lg:text-3xl neon-text-cyan">{formatDistance(activity.distanceKm * 1000)}</p>
          <p className="text-text-secondary font-mono text-xs">KM</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">TIEMPO</p>
          <p className="stat-number text-2xl lg:text-3xl neon-text-lime">{formatTime(activity.movingTime)}</p>
          <p className="text-text-secondary font-mono text-xs">H:M:S</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">RITMO</p>
          <p className="stat-number text-2xl lg:text-3xl neon-text-pink">{formatPace(activity.distanceKm, activity.movingTime)}</p>
          <p className="text-text-secondary font-mono text-xs">MIN/KM</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">VELOCIDAD</p>
          <p className="stat-number text-2xl lg:text-3xl neon-text-cyan">{speed.toFixed(1)}</p>
          <p className="text-text-secondary font-mono text-xs">KM/H</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">DESNIVEL +</p>
          <p className="stat-number text-2xl lg:text-3xl neon-text-gold">{formatElevation(elevationGain)}</p>
          <p className="text-text-secondary font-mono text-xs">M</p>
        </Card>

        <Card neon className="p-4">
          <p className="label-text text-xs mb-1">CALORÍAS</p>
          <p className="stat-number text-2xl lg:text-3xl neon-text-lime">{calories}</p>
          <p className="text-text-secondary font-mono text-xs">KCAL</p>
        </Card>
      </div>

      {/* Métricas de FC */}
      {avgHr > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">FC MEDIA</p>
            <p className="stat-number text-2xl neon-text-pink">{avgHr}</p>
            <p className="text-text-secondary font-mono text-xs">BPM</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">FC MÁXIMA</p>
            <p className="stat-number text-2xl neon-text-red">{maxHr}</p>
            <p className="text-text-secondary font-mono text-xs">BPM</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">INTENSIDAD</p>
            <p className="stat-number text-2xl neon-text-cyan">{intensity}%</p>
            <p className="text-text-secondary font-mono text-xs">FCMAX</p>
          </Card>

          <Card neon className="p-4">
            <p className="label-text text-xs mb-1">ZONA PRINCIPAL</p>
            <p className="stat-number text-xl neon-text-gold">
              {intensity < 60 ? 'Z1' : intensity < 70 ? 'Z2' : intensity < 80 ? 'Z3' : intensity < 90 ? 'Z4' : 'Z5'}
            </p>
            <p className="text-text-secondary font-mono text-xs">HR ZONE</p>
          </Card>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ritmo */}
        {lapsData.length > 0 && (
          <Card>
            <h3 className="text-xl font-mono font-bold text-text-primary mb-4">RITMO POR KILÓMETRO</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lapsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                  <XAxis
                    dataKey="km"
                    stroke="#8B92A5"
                    style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                    label={{ value: 'KM', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    stroke="#8B92A5"
                    style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                    label={{ value: 'min/km', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#151A23',
                      border: '2px solid #00E5FF',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pace"
                    stroke="#00E5FF"
                    fill="#00E5FF"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Gráfico de FC */}
        {lapsData.some(d => d.hr > 0) && (
          <Card>
            <h3 className="text-xl font-mono font-bold text-text-primary mb-4">FRECUENCIA CARDÍACA</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lapsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                  <XAxis
                    dataKey="km"
                    stroke="#8B92A5"
                    style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                    label={{ value: 'KM', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    stroke="#8B92A5"
                    style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                    label={{ value: 'BPM', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#151A23',
                      border: '2px solid #FF3A6E',
                      fontFamily: 'JetBrains Mono',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hr"
                    stroke="#FF3A6E"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="FC Media"
                  />
                  <Line
                    type="monotone"
                    dataKey="maxHr"
                    stroke="#FF6B35"
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray="5 5"
                    name="FC Max"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Tabla de Laps detallada */}
      {activity.laps && activity.laps.length > 0 && (
        <Card>
          <h3 className="text-xl font-mono font-bold text-text-primary mb-4">DETALLE POR KILÓMETRO</h3>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b-2 border-accent-pace">
                  <th className="text-left py-3 px-3 label-text">KM</th>
                  <th className="text-right py-3 px-3 label-text">DISTANCIA</th>
                  <th className="text-right py-3 px-3 label-text">TIEMPO</th>
                  <th className="text-right py-3 px-3 label-text">RITMO</th>
                  <th className="text-right py-3 px-3 label-text">VEL</th>
                  <th className="text-right py-3 px-3 label-text">DESNIVEL</th>
                  <th className="text-right py-3 px-3 label-text">FC</th>
                  <th className="text-right py-3 px-3 label-text">FC MAX</th>
                </tr>
              </thead>
              <tbody>
                {activity.laps.map((lap, index) => (
                  <tr key={index} className="border-b border-border-primary hover:bg-panel-bg/50">
                    <td className="py-2 px-3 text-accent-pace font-bold">{index + 1}</td>
                    <td className="py-2 px-3 text-right text-text-primary">{formatDistance(lap.distance || 0)} km</td>
                    <td className="py-2 px-3 text-right text-text-primary">{formatTime(lap.movingTime || 0)}</td>
                    <td className="py-2 px-3 text-right text-accent-cyan">{formatPace((lap.distance || 0) / 1000, lap.movingTime || 0)}</td>
                    <td className="py-2 px-3 text-right text-text-primary">{((lap.distance || 0) / 1000 / ((lap.movingTime || 0) / 3600)).toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-accent-gold">{formatElevation(lap.elevationGain || 0)} m</td>
                    <td className="py-2 px-3 text-right text-accent-pink">{lap.averageHr ? Math.round(lap.averageHr) : '-'}</td>
                    <td className="py-2 px-3 text-right text-accent-red">{lap.maxHr ? Math.round(lap.maxHr) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Resumen estadístico */}
      <Card>
        <h3 className="text-xl font-mono font-bold text-text-primary mb-4">RESUMEN ESTADÍSTICO</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-panel-bg/50 border border-border-primary">
            <p className="label-text text-xs mb-2">RITMO MEJOR</p>
            <p className="stat-number text-xl neon-text-cyan">
              {lapsData.length > 0 ? Math.min(...lapsData.map(d => d.pace)).toFixed(2) : '-'}
            </p>
            <p className="text-text-secondary font-mono text-xs">MIN/KM</p>
          </div>
          <div className="p-4 bg-panel-bg/50 border border-border-primary">
            <p className="label-text text-xs mb-2">RITMO PEOR</p>
            <p className="stat-number text-xl neon-text-pink">
              {lapsData.length > 0 ? Math.max(...lapsData.map(d => d.pace)).toFixed(2) : '-'}
            </p>
            <p className="text-text-secondary font-mono text-xs">MIN/KM</p>
          </div>
          <div className="p-4 bg-panel-bg/50 border border-border-primary">
            <p className="label-text text-xs mb-2">KM MÁS RÁPIDO</p>
            <p className="stat-number text-xl neon-text-lime">
              {lapsData.length > 0 ? lapsData.reduce((min, d) => d.pace < min.pace ? d : min, lapsData[0])?.km : '-'}
            </p>
            <p className="text-text-secondary font-mono text-xs">KM</p>
          </div>
          <div className="p-4 bg-panel-bg/50 border border-border-primary">
            <p className="label-text text-xs mb-2">FC PROMEDIO</p>
            <p className="stat-number text-xl neon-text-pink">
              {lapsData.some(d => d.hr > 0) ? Math.round(lapsData.reduce((sum, d) => sum + d.hr, 0) / lapsData.filter(d => d.hr > 0).length) : '-'}
            </p>
            <p className="text-text-secondary font-mono text-xs">BPM</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
