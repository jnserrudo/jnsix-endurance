import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { comparisonsService } from '../services/comparisons.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { PersonalRecords } from '../components/comparisons/PersonalRecords';
import { SegmentComparison } from '../components/comparisons/SegmentComparison';
import { formatDistance, formatTime, formatPace, formatDate } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#00E5FF', '#B5FF3A', '#FF3A6E', '#FFB800', '#9D4EDD', '#06FFA5'];

export const Comparisons = () => {
  const { activities } = useActivities(1, 50);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [newComparisonName, setNewComparisonName] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    try {
      const data = await comparisonsService.getComparisons();
      setComparisons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar comparaciones:', error);
      setComparisons([]);
      if (error.code !== 'ERR_NETWORK') {
        toast.error('Error al cargar comparaciones');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComparison = async () => {
    if (!newComparisonName || selectedActivities.length < 2) {
      toast.error('Selecciona al menos 2 actividades y un nombre');
      return;
    }

    try {
      await comparisonsService.createComparison({
        name: newComparisonName,
        activityIds: selectedActivities,
      });
      toast.success('Comparación creada');
      setCreateModalOpen(false);
      setNewComparisonName('');
      setSelectedActivities([]);
      fetchComparisons();
    } catch (error) {
      toast.error('Error al crear comparación');
    }
  };

  const handleDeleteComparison = async (id) => {
    if (!confirm('¿Eliminar esta comparación?')) return;

    try {
      await comparisonsService.deleteComparison(id);
      toast.success('Comparación eliminada');
      fetchComparisons();
      if (selectedComparison?.id === id) {
        setSelectedComparison(null);
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const toggleActivitySelection = (activityId) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const loadComparisonDetail = async (comparison) => {
    try {
      const data = await comparisonsService.getComparisonById(comparison.id);
      setSelectedComparison(data);
    } catch (error) {
      toast.error('Error al cargar detalle');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" text="CARGANDO COMPARACIONES..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-mono font-bold neon-text-cyan">
            COMPARACIONES
          </h1>
          <p className="text-text-secondary font-mono text-xs sm:text-sm mt-2">
            ANÁLISIS MULTI-ACTIVIDAD AVANZADO
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          NUEVA COMPARACIÓN
        </Button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      {/* Récords Personales */}
      <PersonalRecords activities={activities} />

      {/* Comparación de Segmentos */}
      <SegmentComparison activities={activities} />

      {comparisons.length === 0 ? (
        <Card>
          <div className="text-center py-12 sm:py-16">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 neon-text-cyan">◭</div>
            <p className="text-text-secondary font-mono text-base sm:text-xl mb-4">
              NO HAY COMPARACIONES
            </p>
            <p className="text-text-secondary font-mono text-xs sm:text-sm mb-6 sm:mb-8 px-4">
              Crea una comparación para analizar múltiples actividades
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              CREAR PRIMERA COMPARACIÓN
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card neon>
              <h2 className="text-lg sm:text-xl font-mono font-bold text-text-primary mb-4">
                MIS COMPARACIONES
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {comparisons.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => loadComparisonDetail(comp)}
                    className={`p-4 border-2 cursor-pointer transition-all ${
                      selectedComparison?.id === comp.id
                        ? 'border-accent-pace bg-accent-pace/10'
                        : 'border-border-primary hover:border-accent-pace/50'
                    }`}
                    style={{
                      clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)'
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono font-bold text-text-primary truncate">
                          {comp.name}
                        </h3>
                        <p className="text-text-secondary font-mono text-xs mt-1">
                          {comp._count?.activities || 0} actividades
                        </p>
                        <p className="text-text-secondary font-mono text-xs">
                          {formatDate(comp.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComparison(comp.id);
                        }}
                        className="text-neon-pink hover:text-neon-pink/70 font-mono text-lg"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedComparison ? (
              <ComparisonDetail comparison={selectedComparison} />
            ) : (
              <Card>
                <div className="text-center py-12 sm:py-16">
                  <p className="text-text-secondary font-mono text-sm sm:text-base">
                    Selecciona una comparación para ver el análisis
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="NUEVA COMPARACIÓN"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              CANCELAR
            </Button>
            <Button onClick={handleCreateComparison}>
              CREAR
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <Input
            label="NOMBRE DE LA COMPARACIÓN"
            value={newComparisonName}
            onChange={(e) => setNewComparisonName(e.target.value)}
            placeholder="Ej: Progreso Marzo 2026"
          />

          <div>
            <p className="label-text mb-3">
              SELECCIONAR ACTIVIDADES (mínimo 2)
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activities.map((activity) => (
                <label
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-panel-bg border-2 border-border-primary hover:border-accent-pace/50 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedActivities.includes(activity.id)}
                    onChange={() => toggleActivitySelection(activity.id)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-text-primary truncate">
                      {activity.name || 'Sin título'}
                    </p>
                    <p className="font-mono text-xs text-text-secondary">
                      {formatDate(activity.startTime)} • {formatDistance(activity.distance)} km
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-text-secondary font-mono text-xs mt-2">
              {selectedActivities.length} actividades seleccionadas
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ComparisonDetail = ({ comparison }) => {
  const activities = comparison.activities || [];

  const chartData = activities.map((act, index) => ({
    name: act.activity.name?.substring(0, 15) || `Act ${index + 1}`,
    distance: act.activity.distance / 1000,
    time: act.activity.movingTime / 60,
    pace: act.activity.distance > 0 ? (act.activity.movingTime / 60) / (act.activity.distance / 1000) : 0,
    elevation: act.activity.totalElevationGain || 0,
  }));

  const avgDistance = activities.reduce((sum, a) => sum + a.activity.distance, 0) / activities.length / 1000;
  const avgTime = activities.reduce((sum, a) => sum + a.activity.movingTime, 0) / activities.length;
  const avgElevation = activities.reduce((sum, a) => sum + (a.activity.totalElevationGain || 0), 0) / activities.length;

  return (
    <div className="space-y-6">
      <Card neon>
        <h2 className="text-xl sm:text-2xl font-mono font-bold text-text-primary mb-6">
          {comparison.name}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-panel-bg p-4">
            <p className="label-text mb-2">DISTANCIA PROMEDIO</p>
            <p className="stat-number text-2xl sm:text-3xl neon-text-cyan">
              {avgDistance.toFixed(2)}
            </p>
            <p className="text-text-secondary font-mono text-xs">KM</p>
          </div>
          <div className="bg-panel-bg p-4">
            <p className="label-text mb-2">TIEMPO PROMEDIO</p>
            <p className="stat-number text-2xl sm:text-3xl neon-text-lime">
              {formatTime(avgTime)}
            </p>
            <p className="text-text-secondary font-mono text-xs">H:M:S</p>
          </div>
          <div className="bg-panel-bg p-4">
            <p className="label-text mb-2">DESNIVEL PROMEDIO</p>
            <p className="stat-number text-2xl sm:text-3xl neon-text-gold">
              {Math.round(avgElevation)}
            </p>
            <p className="text-text-secondary font-mono text-xs">M</p>
          </div>
        </div>

        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3441" />
              <XAxis
                dataKey="name"
                stroke="#8B92A5"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#8B92A5"
                style={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#151A23',
                  border: '2px solid #00E5FF',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="distance"
                stroke="#00E5FF"
                strokeWidth={3}
                name="Distancia (km)"
              />
              <Line
                type="monotone"
                dataKey="elevation"
                stroke="#B5FF3A"
                strokeWidth={2}
                name="Desnivel (m)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg sm:text-xl font-mono font-bold text-text-primary mb-4">
          TABLA COMPARATIVA
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-accent-pace">
                <th className="text-left py-3 px-2 sm:px-4 label-text">ACTIVIDAD</th>
                <th className="text-right py-3 px-2 sm:px-4 label-text">DISTANCIA</th>
                <th className="text-right py-3 px-2 sm:px-4 label-text">TIEMPO</th>
                <th className="text-right py-3 px-2 sm:px-4 label-text">RITMO</th>
                <th className="text-right py-3 px-2 sm:px-4 label-text">DESNIVEL</th>
                <th className="text-right py-3 px-2 sm:px-4 label-text">FECHA</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act, index) => (
                <tr key={act.id} className="border-b border-border-primary hover:bg-panel-bg/50">
                  <td className="py-3 px-2 sm:px-4">
                    <Link
                      to={`/activities/${act.activity.id}`}
                      className="text-accent-pace hover:underline truncate block max-w-[150px] sm:max-w-none"
                    >
                      {act.activity.name || `Actividad ${index + 1}`}
                    </Link>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right text-text-primary">
                    {formatDistance(act.activity.distance)} km
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right text-text-primary">
                    {formatTime(act.activity.movingTime)}
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right text-accent-cyan">
                    {formatPace(act.activity.distance / 1000, act.activity.movingTime)}
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right text-accent-gold">
                    {Math.round(act.activity.totalElevationGain || 0)}m
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right text-text-secondary text-xs">
                    {formatDate(act.activity.startTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
