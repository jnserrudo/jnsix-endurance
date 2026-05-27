import { ResponsivePie } from '@nivo/pie';
import { GlassCard } from '../ui/GlassCard';

export const HeartRateZones = ({ activities }) => {
  // Filtrar actividades con datos de frecuencia cardíaca
  const activitiesWithHR = activities.filter(a => a.averageHr && a.averageHr > 0);

  if (activitiesWithHR.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-8">
          <p className="text-text-secondary">
            No hay datos de frecuencia cardíaca disponibles
          </p>
        </div>
      </GlassCard>
    );
  }

  // Calcular HR máxima estimada (fórmula simple: 220 - edad)
  // Si no tenemos edad, usamos 190 como valor promedio
  const maxHR = 190;

  // Definir zonas de frecuencia cardíaca con colores premium
  const zones = [
    { name: 'Zona 1', min: 0.5, max: 0.6, color: '#8B92A5', description: 'Recuperación' },
    { name: 'Zona 2', min: 0.6, max: 0.7, color: '#2E5A88', description: 'Aeróbico base' },
    { name: 'Zona 3', min: 0.7, max: 0.8, color: '#94E85D', description: 'Aeróbico' },
    { name: 'Zona 4', min: 0.8, max: 0.9, color: '#FFA500', description: 'Umbral' },
    { name: 'Zona 5', min: 0.9, max: 1.0, color: '#E85D7A', description: 'VO2 Max' },
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
      id: zone.name,
      label: zone.name,
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
      return 'ALTO: Alto entrenamiento en Zona 5 - Considera más recuperación';
    } else if (zone4Percent > 30) {
      return 'BUENO: Buen trabajo en zona de umbral - Mantén la intensidad';
    } else if (zone2Percent + zone3Percent > 70) {
      return 'EXCELENTE: Excelente base aeróbica - Listo para intensificar';
    } else {
      return 'EQUILIBRADO: Distribución equilibrada - Continúa así';
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
    <GlassCard>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary mb-1 text-sm">
            ZONAS DE FRECUENCIA CARDÍACA
          </h3>
          <p className="text-text-secondary text-xs">
            HR máxima estimada: {maxHR} bpm
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico de dona */}
          <div style={{ height: 200 }}>
            <ResponsivePie
              data={pieData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.6}
              padAngle={2}
              cornerRadius={4}
              activeOuterRadiusOffset={8}
              colors={({ data }) => data.color}
              borderWidth={2}
              borderColor="#1A1F2E"
              enableArcLinkLabels={false}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="#E8EAED"
              tooltip={({ datum }) => (
                <div className="glass-panel p-3 rounded-lg">
                  <div className="text-text-primary text-sm font-medium">
                    {datum.label}
                  </div>
                  <div className="text-accent-cyan font-mono font-bold">
                    {datum.percentage}%
                  </div>
                  <div className="text-text-secondary text-xs">
                    {formatTime(datum.value)}
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

          {/* Leyenda y detalles */}
          <div className="space-y-2">
            {pieData.map((zone) => (
              <div key={zone.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div>
                    <p className="text-xs text-text-primary">
                      {zone.name}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {zone.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-xs text-text-primary">
                    {zone.percentage}%
                  </p>
                  <p className="font-mono text-[10px] text-text-secondary">
                    {formatTime(zone.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendación */}
        <div className="glass-panel p-3 rounded-lg">
          <p className="text-xs text-text-primary">
            {getRecommendation()}
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
