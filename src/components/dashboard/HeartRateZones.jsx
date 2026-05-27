import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '../ui/Card';

export const HeartRateZones = ({ activities }) => {
  // Filtrar actividades con datos de frecuencia cardíaca
  const activitiesWithHR = activities.filter(a => a.averageHr && a.averageHr > 0);

  if (activitiesWithHR.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            No hay datos de frecuencia cardíaca disponibles
          </p>
        </div>
      </Card>
    );
  }

  // Calcular HR máxima estimada (fórmula simple: 220 - edad)
  // Si no tenemos edad, usamos 190 como valor promedio
  const maxHR = 190;

  // Definir zonas de frecuencia cardíaca
  const zones = [
    { name: 'Zona 1', min: 0.5, max: 0.6, color: '#888888', description: 'Recuperación' },
    { name: 'Zona 2', min: 0.6, max: 0.7, color: '#0088ff', description: 'Aeróbico base' },
    { name: 'Zona 3', min: 0.7, max: 0.8, color: '#00ff88', description: 'Aeróbico' },
    { name: 'Zona 4', min: 0.8, max: 0.9, color: '#ff8800', description: 'Umbral' },
    { name: 'Zona 5', min: 0.9, max: 1.0, color: '#ff0000', description: 'VO2 Max' },
  ];

  // Calcular tiempo en cada zona (estimado basado en averageHr)
  const zoneData = zones.map(zone => {
    const zoneActivities = activitiesWithHR.filter(a => {
      const hrPercent = a.averageHr / maxHR;
      return hrPercent >= zone.min && hrPercent < zone.max;
    });

    const totalTime = zoneActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
    const count = zoneActivities.length;

    return {
      name: zone.name,
      value: totalTime,
      count,
      color: zone.color,
      description: zone.description
    };
  });

  const totalHRTime = zoneData.reduce((sum, z) => sum + z.value, 0);

  // Convertir a porcentaje
  const pieData = zoneData.map(z => ({
    ...z,
    percentage: totalHRTime > 0 ? Math.round((z.value / totalHRTime) * 100) : 0
  }));

  // Recomendación basada en distribución
  const getRecommendation = () => {
    const zone2Percent = pieData.find(z => z.name === 'Zona 2')?.percentage || 0;
    const zone3Percent = pieData.find(z => z.name === 'Zona 3')?.percentage || 0;
    const zone4Percent = pieData.find(z => z.name === 'Zona 4')?.percentage || 0;
    const zone5Percent = pieData.find(z => z.name === 'Zona 5')?.percentage || 0;

    if (zone5Percent > 20) {
      return '⚠️ Alto entrenamiento en Zona 5 - Considera más recuperación';
    } else if (zone4Percent > 30) {
      return '👍 Buen trabajo en zona de umbral - Mantén la intensidad';
    } else if (zone2Percent + zone3Percent > 70) {
      return '✅ Excelente base aeróbica - Listo para intensificar';
    } else {
      return '💪 Distribución equilibrada - Continúa así';
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h3 className="font-mono font-bold text-text-primary mb-2">
            ZONAS DE FRECUENCIA CARDÍACA
          </h3>
          <p className="text-text-secondary font-mono text-sm">
            Basado en HR máxima estimada: {maxHR} bpm
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfico de dona */}
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #00ff88',
                    borderRadius: '8px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value) => formatTime(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda y detalles */}
          <div className="space-y-3">
            {pieData.map((zone) => (
              <div key={zone.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div>
                    <p className="font-mono text-sm text-text-primary">
                      {zone.name}
                    </p>
                    <p className="font-mono text-xs text-text-secondary">
                      {zone.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-text-primary">
                    {zone.percentage}%
                  </p>
                  <p className="font-mono text-xs text-text-secondary">
                    {formatTime(zone.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendación */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
          <p className="font-mono text-sm text-text-primary">
            {getRecommendation()}
          </p>
        </div>
      </div>
    </Card>
  );
};
