import { Card } from '../ui/Card';
import { formatDistance, formatTime } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const PerformanceTrends = ({ activities }) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Últimos 30 días
  const recentActivities = activities.filter(
    a => new Date(a.startDate) >= thirtyDaysAgo
  );
  const recentDistance = recentActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);
  const recentTime = recentActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
  const recentElevation = recentActivities.reduce((sum, a) => sum + (a.elevationM || 0), 0);
  const recentCount = recentActivities.length;

  // 30 días anteriores (30-60 días atrás)
  const previousActivities = activities.filter(
    a => new Date(a.startDate) >= sixtyDaysAgo && new Date(a.startDate) < thirtyDaysAgo
  );
  const previousDistance = previousActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);
  const previousTime = previousActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
  const previousElevation = previousActivities.reduce((sum, a) => sum + (a.elevationM || 0), 0);
  const previousCount = previousActivities.length;

  // Calcular tendencias
  const calculateTrend = (current, previous) => {
    if (previous === 0) return { value: 0, isUp: true, isNeutral: false };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isUp: change > 0,
      isNeutral: Math.abs(change) < 1
    };
  };

  const distanceTrend = calculateTrend(recentDistance, previousDistance);
  const timeTrend = calculateTrend(recentTime, previousTime);
  const elevationTrend = calculateTrend(recentElevation, previousElevation);
  const countTrend = calculateTrend(recentCount, previousCount);

  // Calcular pace promedio (min/km)
  const calculatePace = (distance, time) => {
    if (distance === 0) return 0;
    return (time / 60) / distance; // minutos por km
  };

  const recentPace = calculatePace(recentDistance, recentTime);
  const previousPace = calculatePace(previousDistance, previousTime);
  const paceTrend = calculateTrend(previousPace, recentPace); // Invertido: menor pace es mejor

  const TrendIcon = ({ isUp, isNeutral }) => {
    if (isNeutral) return <Minus size={16} className="text-text-secondary" />;
    return isUp ? (
      <TrendingUp size={16} className="text-accent-lime" />
    ) : (
      <TrendingDown size={16} className="text-accent-pink" />
    );
  };

  const TrendCard = ({ label, current, previous, trend, unit, isPace = false }) => (
    <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
      <p className="label-text mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="stat-number text-xl">
            {isPace ? current.toFixed(1) : formatDistance(current)}
          </p>
          <p className="text-text-secondary font-mono text-xs">{unit}</p>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon isUp={trend.isUp} isNeutral={trend.isNeutral} />
          <span className={`font-mono text-sm ${trend.isUp ? 'text-accent-lime' : 'text-accent-pink'}`}>
            {trend.value}%
          </span>
        </div>
      </div>
      <p className="text-text-secondary font-mono text-xs mt-2">
        Anterior: {isPace ? previous.toFixed(1) : formatDistance(previous)} {unit}
      </p>
    </div>
  );

  if (previousActivities.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            Se necesitan más de 30 días de datos para mostrar tendencias
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h3 className="font-mono font-bold text-text-primary mb-2">
            TENDENCIAS DE RENDIMIENTO
          </h3>
          <p className="text-text-secondary font-mono text-sm">
            Comparación: Últimos 30 días vs 30 días anteriores
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <TrendCard
            label="DISTANCIA"
            current={recentDistance}
            previous={previousDistance}
            trend={distanceTrend}
            unit="km"
          />
          <TrendCard
            label="TIEMPO"
            current={recentTime / 3600}
            previous={previousTime / 3600}
            trend={timeTrend}
            unit="horas"
          />
          <TrendCard
            label="DESNIVEL"
            current={recentElevation}
            previous={previousElevation}
            trend={elevationTrend}
            unit="m"
          />
          <TrendCard
            label="ACTIVIDADES"
            current={recentCount}
            previous={previousCount}
            trend={countTrend}
            unit=""
          />
        </div>

        {/* Pace promedio */}
        {recentDistance > 0 && previousDistance > 0 && (
          <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
            <p className="label-text mb-2">PACE PROMEDIO</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="stat-number text-xl">{recentPace.toFixed(1)}</p>
                <p className="text-text-secondary font-mono text-xs">min/km</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendIcon isUp={!paceTrend.isUp} isNeutral={paceTrend.isNeutral} />
                <span className={`font-mono text-sm ${!paceTrend.isUp ? 'text-accent-lime' : 'text-accent-pink'}`}>
                  {paceTrend.value}%
                </span>
              </div>
            </div>
            <p className="text-text-secondary font-mono text-xs mt-2">
              Anterior: {previousPace.toFixed(1)} min/km
            </p>
          </div>
        )}

        {/* Frecuencia de entrenamiento */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
          <p className="label-text mb-2">FRECUENCIA DE ENTRENAMIENTO</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-number text-xl">{(recentCount / 30).toFixed(1)}</p>
              <p className="text-text-secondary font-mono text-xs">días/semana</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendIcon isUp={countTrend.isUp} isNeutral={countTrend.isNeutral} />
              <span className={`font-mono text-sm ${countTrend.isUp ? 'text-accent-lime' : 'text-accent-pink'}`}>
                {countTrend.value}%
              </span>
            </div>
          </div>
          <p className="text-text-secondary font-mono text-xs mt-2">
            Anterior: {(previousCount / 30).toFixed(1)} días/semana
          </p>
        </div>
      </div>
    </Card>
  );
};
