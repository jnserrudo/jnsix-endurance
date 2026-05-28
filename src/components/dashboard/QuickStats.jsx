import { Card } from '../ui/Card';
import { formatDistance, formatTime } from '../../utils/formatters';
import { useEffect, useState } from 'react';
import api from '../../services/api';

export const QuickStats = ({ activities }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.get('/activities/dashboard-metrics');
        setMetrics(data.data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} neon>
            <div className="h-24 animate-pulse bg-panel-bg/50" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Esta semana */}
      <Card neon>
        <div className="space-y-1">
          <p className="label-text text-xs text-text-secondary font-mono">ESTA SEMANA</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="stat-number text-3xl sm:text-5xl font-mono font-bold text-accent-cyan">
              {formatDistance(metrics.thisWeek.distance)}
            </p>
            <span className="text-text-secondary font-mono text-xs sm:text-sm">km</span>
          </div>
          <p className="text-text-secondary font-mono text-[10px] sm:text-xs mt-2 opacity-80">
            {metrics.thisWeek.count} actividades
          </p>
        </div>
      </Card>

      {/* Este mes */}
      <Card neon>
        <div className="space-y-1">
          <p className="label-text text-xs text-text-secondary font-mono">ESTE MES</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="stat-number text-3xl sm:text-5xl font-mono font-bold text-accent-lime">
              {formatDistance(metrics.thisMonth.distance)}
            </p>
            <span className="text-text-secondary font-mono text-xs sm:text-sm">km</span>
          </div>
          <p className="text-text-secondary font-mono text-[10px] sm:text-xs mt-2 opacity-80">
            {metrics.thisMonth.count} actividades
          </p>
        </div>
      </Card>

      {/* Récord distancia */}
      <Card neon>
        <div className="space-y-1">
          <p className="label-text text-xs text-text-secondary font-mono">RÉCORD</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="stat-number text-3xl sm:text-5xl font-mono font-bold text-accent-gold">
              {formatDistance(metrics.record.distance)}
            </p>
            <span className="text-text-secondary font-mono text-xs sm:text-sm">km</span>
          </div>
          <p className="text-text-secondary font-mono text-[10px] sm:text-xs mt-2 opacity-80 truncate" title={metrics.record.name}>
            {metrics.record.name || 'Sin título'}
          </p>
        </div>
      </Card>

      {/* Racha */}
      <Card neon>
        <div className="space-y-1">
          <p className="label-text text-xs text-text-secondary font-mono">RACHA</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="stat-number text-3xl sm:text-5xl font-mono font-bold text-accent-pink">
              {metrics.streak}
            </p>
            <span className="text-text-secondary font-mono text-xs sm:text-sm">días</span>
          </div>
          <p className="text-text-secondary font-mono text-[10px] sm:text-xs mt-2 opacity-80">
            {metrics.streak > 0 ? '¡Sigue así!' : 'Sin racha'}
          </p>
        </div>
      </Card>
    </div>
  );
};
