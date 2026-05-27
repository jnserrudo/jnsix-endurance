import { GlassCard } from '../ui/GlassCard';
import { formatDistance, formatTime } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';

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

  // Preparar datos para gráfico de línea (distancia semanal últimos 8 semanas)
  const weeklyData = activities.reduce((acc, activity) => {
    const date = new Date(activity.startDate);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!acc[weekKey]) {
      acc[weekKey] = { week: weekKey, distance: 0, count: 0 };
    }
    acc[weekKey].distance += activity.distanceKm || 0;
    acc[weekKey].count += 1;
    return acc;
  }, {});

  const lineChartData = Object.values(weeklyData)
    .sort((a, b) => new Date(a.week) - new Date(b.week))
    .slice(-8)
    .map(d => ({
      x: d.week.slice(5), // MM-DD
      y: d.distance
    }));

  const TrendIcon = ({ isUp, isNeutral }) => {
    if (isNeutral) return <Minus size={16} className="text-text-secondary" />;
    return isUp ? (
      <TrendingUp size={16} className="text-accent-lime" />
    ) : (
      <TrendingDown size={16} className="text-accent-pink" />
    );
  };

  const TrendCard = ({ label, current, previous, trend, unit, isPace = false }) => (
    <div className="glass-panel p-4 rounded-lg">
      <p className="label-text mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-xl font-bold">
            {isPace ? current.toFixed(1) : formatDistance(current)}
          </p>
          <p className="text-text-secondary text-xs">{unit}</p>
        </div>
        <div className="flex items-center gap-2">
          <TrendIcon isUp={trend.isUp} isNeutral={trend.isNeutral} />
          <span className={`font-mono text-sm ${trend.isUp ? 'text-accent-lime' : 'text-accent-pink'}`}>
            {trend.value}%
          </span>
        </div>
      </div>
      <p className="text-text-secondary text-xs mt-2">
        Anterior: {isPace ? previous.toFixed(1) : formatDistance(previous)} {unit}
      </p>
    </div>
  );

  if (previousActivities.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <p className="text-text-secondary">
            Se necesitan más de 30 días de datos para mostrar tendencias
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-text-primary mb-2">
            TENDENCIAS DE RENDIMIENTO
          </h3>
          <p className="text-text-secondary text-sm">
            Comparación: Últimos 30 días vs 30 días anteriores
          </p>
        </div>

        {/* Gráfico de línea - distancia semanal */}
        {lineChartData.length > 0 && (
          <div className="glass-panel p-4 rounded-lg">
            <h4 className="font-semibold text-text-primary mb-4 text-sm">
              DISTANCIA SEMANAL (8 SEMANAS)
            </h4>
            <div style={{ height: 200 }}>
              <ResponsiveLine
                data={[{ id: 'distance', data: lineChartData }]}
                margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                curve="monotone"
                axisBottom={{
                  tickRotation: -45,
                  tickPadding: 10,
                  tickSize: 0,
                  tickColor: '#B8BCC5',
                  style: { tick: { fill: '#B8BCC5', fontSize: 10 } }
                }}
                axisLeft={{
                  tickPadding: 10,
                  tickSize: 0,
                  tickColor: '#B8BCC5',
                  style: { tick: { fill: '#B8BCC5', fontSize: 10 } }
                }}
                enableGridX={false}
                enableGridY={true}
                gridYLineColor="rgba(255, 255, 255, 0.05)"
                colors={['#00D4FF']}
                lineWidth={3}
                pointSize={6}
                pointColor="#00D4FF"
                pointBorderWidth={2}
                pointBorderColor="#1A1F2E"
                enablePointLabel={false}
                useMesh={true}
                enableSlices="x"
                sliceTooltip={({ slice }) => (
                  <div className="glass-panel p-3 rounded-lg">
                    <div className="text-text-primary text-sm font-medium">
                      {slice.points[0].data.x}
                    </div>
                    <div className="text-accent-cyan font-mono font-bold">
                      {slice.points[0].data.y.toFixed(1)} km
                    </div>
                  </div>
                )}
                theme={{
                  tooltip: {
                    container: {
                      background: 'rgba(26, 31, 46, 0.9)',
                      color: '#E8EAED',
                      fontSize: 12,
                      borderRadius: 8,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                    }
                  }
                }}
                animate={true}
                motionConfig="stiff"
              />
            </div>
          </div>
        )}

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

        {/* Ritmo promedio */}
        {recentDistance > 0 && previousDistance > 0 && (
          <div className="glass-panel p-4 rounded-lg">
            <p className="label-text mb-2">RITMO PROMEDIO</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-xl font-bold">{recentPace.toFixed(1)}</p>
                <p className="text-text-secondary text-xs">min/km</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendIcon isUp={!paceTrend.isUp} isNeutral={paceTrend.isNeutral} />
                <span className={`font-mono text-sm ${!paceTrend.isUp ? 'text-accent-lime' : 'text-accent-pink'}`}>
                  {paceTrend.value}%
                </span>
              </div>
            </div>
            <p className="text-text-secondary text-xs mt-2">
              Anterior: {previousPace.toFixed(1)} min/km
            </p>
          </div>
        )}

        {/* Frecuencia de entrenamiento */}
        <div className="glass-panel p-4 rounded-lg">
          <p className="label-text mb-2">FRECUENCIA DE ENTRENAMIENTO</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xl font-bold">{(recentCount / 30).toFixed(1)}</p>
              <p className="text-text-secondary text-xs">días/semana</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendIcon isUp={countTrend.isUp} isNeutral={countTrend.isNeutral} />
              <span className={`font-mono text-sm ${countTrend.isUp ? 'text-accent-lime' : 'text-accent-pink'}`}>
                {countTrend.value}%
              </span>
            </div>
          </div>
          <p className="text-text-secondary text-xs mt-2">
            Anterior: {(previousCount / 30).toFixed(1)} días/semana
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
