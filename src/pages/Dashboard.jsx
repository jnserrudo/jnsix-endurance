import { useActivities } from '../hooks/useActivities';
import { useAutoSync } from '../hooks/useAutoSync';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ProgressCharts } from '../components/dashboard/ProgressCharts';
import { QuickStats } from '../components/dashboard/QuickStats';
import { HeartRateZones } from '../components/dashboard/HeartRateZones';
import { PerformanceTrends } from '../components/dashboard/PerformanceTrends';
import { RacePredictor } from '../components/analysis/RacePredictor';
import { FatigueMonitor } from '../components/analysis/FatigueMonitor';
import { TrainingZones } from '../components/analysis/TrainingZones';
import { RecoveryAdvice } from '../components/analysis/RecoveryAdvice';
import { Link } from 'react-router-dom';
import { formatDistance, formatTime, formatDate, formatActivityType } from '../utils/formatters';

export const Dashboard = () => {
  const { activities, loading } = useActivities(1, 50); // Cargar más actividades para gráficos
  const { isChecking } = useAutoSync();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" text="CARGANDO DASHBOARD..." />
      </div>
    );
  }

  const totalDistance = activities.reduce((sum, act) => sum + (act.distance || 0), 0);
  const totalTime = activities.reduce((sum, act) => sum + (act.movingTime || 0), 0);
  const totalElevation = activities.reduce((sum, act) => sum + (act.totalElevationGain || 0), 0);

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-mono font-bold neon-text-cyan">
            DASHBOARD
          </h1>
          <p className="text-text-secondary font-mono text-sm mt-2">
            SISTEMA DE ANÁLISIS DE RENDIMIENTO
          </p>
        </div>
        <Link to="/activities">
          <Button>VER TODAS</Button>
        </Link>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      {/* Quick Stats - Esta semana, este mes, récords, racha */}
      <QuickStats activities={activities} />

      {/* Gráficos de progreso */}
      {activities.length > 0 && <ProgressCharts activities={activities} />}

      {/* Zonas de frecuencia cardíaca */}
      {activities.length > 0 && <HeartRateZones activities={activities} />}

      {/* Tendencias de rendimiento */}
      {activities.length > 0 && <PerformanceTrends activities={activities} />}

      {/* Predicción de tiempos de carrera */}
      {activities.length > 0 && <RacePredictor activities={activities} />}

      {/* Monitor de fatiga */}
      {activities.length > 0 && <FatigueMonitor activities={activities} />}

      {/* Zonas de entrenamiento */}
      {activities.length > 0 && <TrainingZones activities={activities} />}

      {/* Consejos de recuperación */}
      {activities.length > 0 && <RecoveryAdvice activities={activities} />}

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-mono font-bold text-text-primary">
            ACTIVIDADES RECIENTES
          </h2>
          <span className="text-text-secondary font-mono text-sm">
            {activities.length} REGISTROS
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary font-mono text-lg mb-4">
              NO HAY ACTIVIDADES REGISTRADAS
            </p>
            <Link to="/activities">
              <Button>AGREGAR ACTIVIDAD</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="block"
              >
                <div className="bg-panel-bg border-2 border-border-primary p-4 hover:border-accent-pace transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-accent-pace font-mono font-bold">
                          {formatActivityType(activity.type)}
                        </span>
                        <span className="text-text-secondary font-mono text-sm">
                          {formatDate(activity.startTime)}
                        </span>
                      </div>
                      <h3 className="text-text-primary font-mono text-lg">
                        {activity.name || 'Sin título'}
                      </h3>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="label-text">DISTANCIA</p>
                        <p className="font-mono text-accent-pace font-bold">
                          {formatDistance(activity.distance)} km
                        </p>
                      </div>
                      <div>
                        <p className="label-text">TIEMPO</p>
                        <p className="font-mono text-accent-lime font-bold">
                          {formatTime(activity.movingTime)}
                        </p>
                      </div>
                      <div>
                        <p className="label-text">DESNIVEL</p>
                        <p className="font-mono text-accent-gold font-bold">
                          {Math.round(activity.totalElevationGain || 0)}m
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
