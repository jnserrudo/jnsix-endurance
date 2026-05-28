import { useState, useEffect } from 'react';
import { useActivitiesContext } from '../contexts/ActivitiesContext';
import { useAutoSync } from '../hooks/useAutoSync';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ProgressCharts } from '../components/dashboard/ProgressCharts';
import { QuickStats } from '../components/dashboard/QuickStats';
import { HeartRateZones } from '../components/dashboard/HeartRateZones';
import { PerformanceTrends } from '../components/dashboard/PerformanceTrends';
import { PaceCalculator } from '../components/analysis/PaceCalculator';
import { RacePredictor } from '../components/analysis/RacePredictor';
import { FatigueMonitor } from '../components/analysis/FatigueMonitor';
import { TrainingZones } from '../components/analysis/TrainingZones';
import { RecoveryAdvice } from '../components/analysis/RecoveryAdvice';
import { Link } from 'react-router-dom';
import { formatDistance, formatTime, formatDate, formatActivityType } from '../utils/formatters';

export const Dashboard = () => {
  const { activities, loading, fetchActivities } = useActivitiesContext();
  const { isChecking } = useAutoSync();
  const [activeTab, setActiveTab] = useState('resumen');

  useEffect(() => {
    // Solo fetch si no hay actividades cargadas
    if (activities.length === 0 && !loading) {
      fetchActivities(1, 100);
    }
  }, [activities.length, loading, fetchActivities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" text="CARGANDO DASHBOARD..." />
      </div>
    );
  }

  const tabs = [
    { id: 'resumen', label: 'RESUMEN' },
    { id: 'rendimiento', label: 'RENDIMIENTO' },
    { id: 'predicciones', label: 'PREDICCIONES' },
    { id: 'entrenamiento', label: 'ENTRENAMIENTO' },
    { id: 'actividades', label: 'ACTIVIDADES' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">
            ANÁLISIS DEPORTIVO
          </h1>
          <p className="text-text-secondary text-sm mt-2 font-medium">
            Centro de Comando de Rendimiento: Hub de Analíticas Multicapa
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/ai-analysis">
            <Button variant="glass">ANÁLISIS IA</Button>
          </Link>
          <Link to="/activities">
            <Button>VER TODAS</Button>
          </Link>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold tracking-tight transition-all rounded-lg whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-accent-cyan text-app-bg'
                : 'bg-panel-bg-solid border border-border-primary text-text-primary hover:border-accent-cyan'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metricas generales al inicio (full width) */}
      {activeTab === 'resumen' && activities.length > 0 && (
        <div className="w-full animate-scale-in">
          <QuickStats activities={activities} />
        </div>
      )}

      {/* Layout 2 columnas para el resto del resumen */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda - Recent Activity Feed (33% de ancho -> 4 columnas) */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard>
              <h3 className="text-lg font-semibold text-text-primary mb-4">ACTIVIDADES RECIENTES</h3>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <Link
                    key={activity.id}
                    to={`/activities/${activity.id}`}
                    className="block"
                  >
                    <div className="glass-panel p-3 hover:border-accent-cyan transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-accent-cyan text-xs font-semibold uppercase">
                          {formatActivityType(activity.type)}
                        </span>
                        <span className="text-text-secondary text-xs">
                          {formatDate(activity.startDate)}
                        </span>
                      </div>
                      <h4 className="text-text-primary font-medium text-sm mb-2">
                        {activity.name || 'Sin título'}
                      </h4>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-text-muted block">DISTANCIA</span>
                          <span className="text-accent-cyan font-mono font-semibold">
                            {formatDistance(activity.distanceKm * 1000)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted block">TIEMPO</span>
                          <span className="text-accent-lime font-mono font-semibold">
                            {formatTime(activity.movingTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Columna Derecha - Main Graph (67% de ancho -> 8 columnas) */}
          <div className="lg:col-span-8 space-y-4">
            <GlassCard>
              <h3 className="text-lg font-semibold text-text-primary mb-4">PROGRESO</h3>
              {activities.length > 0 && <ProgressCharts activities={activities} />}
            </GlassCard>
          </div>
        </div>
      )}

      {/* Otras tabs mantienen layout original */}
      {activeTab === 'rendimiento' && (
        <div className="space-y-6">
          {activities.length > 0 && <HeartRateZones activities={activities} />}
          {activities.length > 0 && <PerformanceTrends activities={activities} />}
        </div>
      )}

      {activeTab === 'predicciones' && (
        <div className="space-y-6">
          {activities.length > 0 && <PaceCalculator activities={activities} />}
          {activities.length > 0 && <RacePredictor activities={activities} />}
          {activities.length > 0 && <FatigueMonitor activities={activities} />}
        </div>
      )}

      {activeTab === 'entrenamiento' && (
        <div className="space-y-6">
          {activities.length > 0 && <TrainingZones activities={activities} />}
          {activities.length > 0 && <RecoveryAdvice activities={activities} />}
        </div>
      )}

      {activeTab === 'actividades' && (
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">
              ACTIVIDADES RECIENTES
            </h2>
            <span className="text-text-secondary text-sm">
              {activities.length} REGISTROS
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg mb-4">
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
                  <div className="glass-panel p-4 hover:border-accent-cyan transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-accent-cyan font-semibold text-sm">
                            {formatActivityType(activity.type)}
                          </span>
                          <span className="text-text-secondary text-sm">
                            {formatDate(activity.startDate)}
                          </span>
                        </div>
                        <h3 className="text-text-primary font-medium">
                          {activity.name || 'Sin título'}
                        </h3>
                      </div>
                      <div className="flex gap-4 sm:gap-6 text-left sm:text-right">
                        <div>
                          <p className="label-text text-xs">DISTANCIA</p>
                          <p className="font-mono text-accent-cyan font-semibold">
                            {formatDistance(activity.distanceKm * 1000)} km
                          </p>
                        </div>
                        <div>
                          <p className="label-text text-xs">TIEMPO</p>
                          <p className="font-mono text-accent-lime font-semibold">
                            {formatTime(activity.movingTime)}
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="label-text text-xs">DESNIVEL</p>
                          <p className="font-mono text-accent-gold font-semibold">
                            {Math.round(activity.elevationM || 0)}m
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};
