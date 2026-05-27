import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesService } from '../services/activities.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { formatDistance, formatTime, formatDate, formatActivityType, formatPace } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

  const lapsData = activity.laps?.map((lap, index) => ({
    km: index + 1,
    pace: lap.averageSpeed ? (1000 / lap.averageSpeed / 60) : 0,
    elevation: lap.totalElevationGain || 0,
    hr: lap.averageHeartRate || 0,
  })) || [];

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-accent-pace font-mono font-bold text-xl">
              {formatActivityType(activity.type)}
            </span>
            <span className="text-text-secondary font-mono">
              {formatDate(activity.startTime)}
            </span>
          </div>
          <h1 className="text-4xl font-mono font-bold neon-text-cyan">
            {activity.name || 'Sin título'}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => navigate('/activities')}>
          VOLVER
        </Button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card neon>
          <p className="label-text mb-2">DISTANCIA</p>
          <p className="stat-number neon-text-cyan">
            {formatDistance(activity.distance)}
          </p>
          <p className="text-text-secondary font-mono text-sm">KM</p>
        </Card>

        <Card neon>
          <p className="label-text mb-2">TIEMPO</p>
          <p className="stat-number neon-text-lime">
            {formatTime(activity.movingTime)}
          </p>
          <p className="text-text-secondary font-mono text-sm">H:M:S</p>
        </Card>

        <Card neon>
          <p className="label-text mb-2">DESNIVEL</p>
          <p className="stat-number neon-text-gold">
            {Math.round(activity.totalElevationGain || 0)}
          </p>
          <p className="text-text-secondary font-mono text-sm">METROS</p>
        </Card>

        <Card neon>
          <p className="label-text mb-2">RITMO MEDIO</p>
          <p className="stat-number neon-text-pink">
            {formatPace(activity.distance / 1000, activity.movingTime)}
          </p>
          <p className="text-text-secondary font-mono text-sm">MIN/KM</p>
        </Card>
      </div>

      {lapsData.length > 0 && (
        <Card>
          <h2 className="text-2xl font-mono font-bold text-text-primary mb-6">
            ANÁLISIS POR KILÓMETRO
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lapsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
                <XAxis
                  dataKey="km"
                  stroke="#8B92A5"
                  style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                />
                <YAxis
                  stroke="#8B92A5"
                  style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#151A23',
                    border: '2px solid #00E5FF',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pace"
                  stroke="#00E5FF"
                  strokeWidth={3}
                  dot={false}
                  name="Ritmo (min/km)"
                />
                {lapsData.some(d => d.hr > 0) && (
                  <Line
                    type="monotone"
                    dataKey="hr"
                    stroke="#FF3A6E"
                    strokeWidth={2}
                    dot={false}
                    name="FC (bpm)"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {activity.laps && activity.laps.length > 0 && (
        <Card>
          <h2 className="text-2xl font-mono font-bold text-text-primary mb-6">
            TABLA DE LAPS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b-2 border-accent-pace">
                  <th className="text-left py-3 px-4 label-text">KM</th>
                  <th className="text-right py-3 px-4 label-text">DISTANCIA</th>
                  <th className="text-right py-3 px-4 label-text">TIEMPO</th>
                  <th className="text-right py-3 px-4 label-text">RITMO</th>
                  <th className="text-right py-3 px-4 label-text">FC MEDIA</th>
                </tr>
              </thead>
              <tbody>
                {activity.laps.map((lap, index) => (
                  <tr key={index} className="border-b border-border-primary hover:bg-panel-bg/50">
                    <td className="py-3 px-4 text-accent-pace font-bold">{index + 1}</td>
                    <td className="py-3 px-4 text-right text-text-primary">
                      {formatDistance(lap.distance)} km
                    </td>
                    <td className="py-3 px-4 text-right text-text-primary">
                      {formatTime(lap.movingTime)}
                    </td>
                    <td className="py-3 px-4 text-right text-accent-cyan">
                      {formatPace(lap.distance / 1000, lap.movingTime)}
                    </td>
                    <td className="py-3 px-4 text-right text-accent-pink">
                      {lap.averageHeartRate ? `${Math.round(lap.averageHeartRate)} bpm` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
