import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { formatDistance, formatDate } from '../../utils/formatters';

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

  const weeklyChartData = Object.values(weeklyData)
    .sort((a, b) => new Date(a.week) - new Date(b.week))
    .slice(-8)
    .map(d => ({
      x: formatDate(d.week),
      y: d.distance
    }));

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

  const typeChartData = Object.values(typeData);

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
        <h3 className="font-semibold text-text-primary mb-4 text-sm">
          DISTANCIA SEMANAL (8 SEMANAS)
        </h3>
        <div style={{ height: 200 }}>
          <ResponsiveLine
            data={[{ id: 'distance', data: weeklyChartData }]}
            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 0, max: 'auto' }}
            curve="monotoneX"
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
            theme={CHART_THEME}
          />
        </div>
      </div>

      {/* Gráfico de actividades por tipo */}
      <div className="glass-panel p-4">
        <h3 className="font-semibold text-text-primary mb-4 text-sm">
          ACTIVIDADES POR TIPO
        </h3>
        <div style={{ height: 200 }}>
          <ResponsiveBar
            data={typeChartData}
            keys={['count']}
            indexBy="type"
            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={({ index }) => colors[typeChartData[index]?.type] || '#8B92A5'}
            borderRadius={4}
            borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
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
            enableGridY={true}
            gridYLineColor="rgba(255, 255, 255, 0.05)"
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#B8BCC5"
            labelStyle={{ fontSize: 10 }}
            tooltip={({ data }) => (
              <div className="glass-panel p-3 rounded-lg">
                <div className="text-text-primary text-sm font-medium">
                  {data.type}
                </div>
                <div className="text-accent-lime font-mono font-bold">
                  {data.count} actividades
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
