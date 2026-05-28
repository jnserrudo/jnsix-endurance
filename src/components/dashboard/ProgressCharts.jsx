import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { formatDistance, formatDate, formatActivityType } from '../../utils/formatters';

const CHART_THEME = {
  axis: {
    domain: {
      line: {
        stroke: 'rgba(255, 255, 255, 0.1)',
        strokeWidth: 1
      }
    },
    ticks: {
      line: {
        stroke: 'rgba(255, 255, 255, 0.1)',
        strokeWidth: 1
      },
      text: {
        fill: '#B8BCC5',
        fontSize: 10,
        fontFamily: 'JetBrains Mono, monospace'
      }
    }
  },
  grid: {
    line: {
      stroke: 'rgba(255, 255, 255, 0.05)',
      strokeWidth: 1
    }
  },
  tooltip: {
    container: {
      background: '#151A23',
      color: '#E6EDF3',
      fontSize: 12,
      borderRadius: 4,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
    }
  }
};

export const ProgressCharts = ({ activities }) => {
  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '');
  };

  // Agrupar actividades por semana (últimas 8 semanas)
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

  const sortedWeeks = Object.values(weeklyData).sort((a, b) => new Date(a.week) - new Date(b.week));
  const sliceWeeks = sortedWeeks.slice(-8);

  const weeklyChartData = sliceWeeks.map(d => ({
    x: formatShortDate(d.week),
    y: d.distance
  }));

  let dateRangeText = "";
  if (sliceWeeks.length > 0) {
    const startWeek = new Date(sliceWeeks[0].week);
    const endWeek = new Date(sliceWeeks[sliceWeeks.length - 1].week);
    endWeek.setDate(endWeek.getDate() + 6);
    
    const formatRangeDate = (date) => {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };
    dateRangeText = `${formatRangeDate(startWeek)} - ${formatRangeDate(endWeek)}`;
  }

  // Agrupar por tipo de actividad
  const typeData = activities.reduce((acc, activity) => {
    const type = activity.type || 'OTHER';
    if (!acc[type]) {
      acc[type] = { type, count: 0, distance: 0 };
    }
    acc[type].count += 1;
    acc[type].distance += activity.distanceKm || 0;
    return acc;
  }, {});

  const typeChartData = Object.values(typeData).map(d => ({
    ...d,
    translatedType: formatActivityType(d.type)
  }));

  const colors = {
    RUN: '#00D4FF',
    RIDE: '#94E85D',
    SWIM: '#E85D7A',
    TRAIL_RUN: '#FFA500',
    VIRTUAL_RUN: '#D47E5E',
    VIRTUAL_RIDE: '#2E5A88',
    OTHER: '#8B92A5'
  };

  return (
    <div className="space-y-4">
      {/* Gráfico de distancia semanal */}
      <div className="glass-panel p-4">
        <div>
          <h3 className="font-semibold text-text-primary text-sm uppercase">
            DISTANCIA SEMANAL (ÚLTIMAS 8 SEMANAS{dateRangeText ? `: ${dateRangeText}` : ''})
          </h3>
          <p className="text-text-secondary text-xs mt-1 mb-4">
            Volumen acumulado en kilómetros por cada una de las últimas 8 semanas de entrenamiento.
          </p>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveLine
            data={[{ id: 'distance', data: weeklyChartData }]}
            margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 0, max: 'auto' }}
            curve="monotoneX"
            enableArea={true}
            areaOpacity={0.15}
            axisBottom={{
              tickRotation: -30,
              tickPadding: 10,
              tickSize: 0
            }}
            axisLeft={{
              tickPadding: 10,
              tickSize: 0,
              tickValues: 5
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
            theme={CHART_THEME}
          />
        </div>
      </div>

      {/* Gráfico de actividades por tipo */}
      <div className="glass-panel p-4">
        <div>
          <h3 className="font-semibold text-text-primary text-sm uppercase">
            DISTRIBUCIÓN POR TIPO DE ACTIVIDAD (HISTORIAL COMPLETO: {activities.length} ACTIVIDADES)
          </h3>
          <p className="text-text-secondary text-xs mt-1 mb-4">
            Cantidad de entrenamientos por cada disciplina deportiva registradas en todo tu historial.
          </p>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveBar
            data={typeChartData}
            keys={['count']}
            indexBy="translatedType"
            margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={({ data }) => colors[data.type] || '#8B92A5'}
            borderRadius={4}
            borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
            axisBottom={{
              tickRotation: -20,
              tickPadding: 10,
              tickSize: 0
            }}
            axisLeft={{
              tickPadding: 10,
              tickSize: 0,
              tickValues: 5
            }}
            enableGridY={true}
            gridYLineColor="rgba(255, 255, 255, 0.05)"
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#B8BCC5"
            labelStyle={{ fontSize: 10 }}
            tooltip={({ data }) => (
              <div className="glass-panel p-3 rounded-lg">
                <div className="text-text-primary text-sm font-medium">
                  {data.translatedType}
                </div>
                <div className="text-accent-lime font-mono font-bold">
                  {data.count} {data.count === 1 ? 'actividad' : 'actividades'}
                </div>
              </div>
            )}
            theme={CHART_THEME}
            animate={true}
            motionConfig="stiff"
          />
        </div>
      </div>
    </div>
  );
};
