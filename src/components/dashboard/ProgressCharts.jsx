import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDistance, formatDate } from '../../utils/formatters';

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
      ...d,
      week: formatDate(d.week)
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
    RUN: '#00ff88',
    RIDE: '#00ffff',
    SWIM: '#ff00ff',
    TRAIL_RUN: '#ffff00',
    VIRTUAL_RUN: '#ff8800',
    VIRTUAL_RIDE: '#0088ff',
    OTHER: '#888888'
  };

  return (
    <div className="space-y-6">
      {/* Gráfico de distancia semanal */}
      <div className="bg-panel-bg border-2 border-border-primary rounded-lg p-6">
        <h3 className="font-mono font-bold text-text-primary mb-4">
          DISTANCIA SEMANAL (ÚLTIMAS 8 SEMANAS)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="week" 
              stroke="#888"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ff88',
                borderRadius: '8px',
                fontFamily: 'monospace'
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="distance" 
              stroke="#00ff88" 
              strokeWidth={2}
              dot={{ fill: '#00ff88', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de actividades por tipo */}
      <div className="bg-panel-bg border-2 border-border-primary rounded-lg p-6">
        <h3 className="font-mono font-bold text-text-primary mb-4">
          ACTIVIDADES POR TIPO
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={typeChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="type" 
              stroke="#888"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a2e', 
                border: '1px solid #00ffff',
                borderRadius: '8px',
                fontFamily: 'monospace'
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count">
              {typeChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[entry.type] || '#888'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
