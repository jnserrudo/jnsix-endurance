import { Card } from '../ui/Card';
import { Target, Zap, Activity } from 'lucide-react';
import { formatDistance, formatTime } from '../../utils/formatters';

export const TrainingZones = ({ activities }) => {
  // Filtrar actividades con datos de frecuencia cardíaca
  const activitiesWithHR = activities.filter(a => a.averageHr && a.averageHr > 0);

  if (activitiesWithHR.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            Se necesitan datos de frecuencia cardíaca para mostrar zonas de entrenamiento
          </p>
        </div>
      </Card>
    );
  }

  // Calcular HR máxima estimada
  const maxHR = 190;

  // Definir zonas de entrenamiento con descripciones
  const trainingZones = [
    {
      name: 'Zona 1',
      minPercent: 50,
      maxPercent: 60,
      color: '#888888',
      description: 'Recuperación activa',
      benefit: 'Mejora circulación, recuperación',
      icon: Activity,
      pace: 'Muy fácil'
    },
    {
      name: 'Zona 2',
      minPercent: 60,
      maxPercent: 70,
      color: '#0088ff',
      description: 'Aeróbico base',
      benefit: 'Desarrolla resistencia, quema grasa',
      icon: Activity,
      pace: 'Fácil'
    },
    {
      name: 'Zona 3',
      minPercent: 70,
      maxPercent: 80,
      color: '#00ff88',
      description: 'Aeróbico',
      benefit: 'Mejora capacidad aeróbica',
      icon: Zap,
      pace: 'Moderado'
    },
    {
      name: 'Zona 4',
      minPercent: 80,
      maxPercent: 90,
      color: '#ff8800',
      description: 'Umbral',
      benefit: 'Aumenta velocidad sostenida',
      icon: Target,
      pace: 'Difícil'
    },
    {
      name: 'Zona 5',
      minPercent: 90,
      maxPercent: 100,
      color: '#ff0000',
      description: 'VO2 Max',
      benefit: 'Mejora potencia máxima',
      icon: Zap,
      pace: 'Muy difícil'
    }
  ];

  // Calcular tiempo en cada zona
  const zoneData = trainingZones.map(zone => {
    const zoneActivities = activitiesWithHR.filter(a => {
      const hrPercent = a.averageHr / maxHR;
      return hrPercent >= zone.minPercent && hrPercent < zone.maxPercent;
    });

    const totalTime = zoneActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
    const count = zoneActivities.length;
    const totalDistance = zoneActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);

    return {
      ...zone,
      totalTime,
      count,
      totalDistance
    };
  });

  const totalHRTime = zoneData.reduce((sum, z) => sum + z.totalTime, 0);

  // Calcular distribución porcentual
  const zoneDataWithPercent = zoneData.map(z => ({
    ...z,
    percentage: totalHRTime > 0 ? Math.round((z.totalTime / totalHRTime) * 100) : 0
  }));

  // Recomendación de distribución ideal
  const idealDistribution = {
    'Zona 1': 10,
    'Zona 2': 40,
    'Zona 3': 30,
    'Zona 4': 15,
    'Zona 5': 5
  };

  const ZoneCard = ({ zone, ideal }) => {
    const ZoneIcon = zone.icon;
    const isBelowIdeal = zone.percentage < ideal;
    const isAboveIdeal = zone.percentage > ideal + 10;
    const isOptimal = Math.abs(zone.percentage - ideal) <= 10;

    const statusColor = isOptimal ? 'text-accent-lime' : isBelowIdeal ? 'text-accent-cyan' : 'text-accent-pink';
    const statusText = isOptimal ? '✓ Óptimo' : isBelowIdeal ? '↑ Aumentar' : '↓ Reducir';

    return (
      <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <ZoneIcon size={18} style={{ color: zone.color }} />
            <div>
              <h4 className="font-mono font-bold text-text-primary">
                {zone.name}
              </h4>
              <p className="text-text-secondary font-mono text-xs">
                {zone.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-mono font-bold text-sm ${statusColor}`}>
              {statusText}
            </p>
            <p className="text-text-secondary font-mono text-xs">
              Ideal: {ideal}%
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Barra de progreso */}
          <div className="w-full bg-border-primary rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ 
                width: `${zone.percentage}%`,
                backgroundColor: zone.color
              }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono">
            <span className="text-text-secondary">Actual: {zone.percentage}%</span>
            <span className="text-text-secondary">{formatTime(zone.totalTime)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-text-secondary">Actividades</p>
              <p className="font-mono text-text-primary">{zone.count}</p>
            </div>
            <div>
              <p className="text-text-secondary">Distancia</p>
              <p className="font-mono text-text-primary">{formatDistance(zone.totalDistance)} km</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border-primary">
            <p className="text-text-secondary font-mono text-xs">
              {zone.benefit}
            </p>
            <p className="text-text-secondary font-mono text-xs">
              Pace: {zone.pace}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} className="text-accent-lime" />
            <h3 className="font-mono font-bold text-text-primary">
              ZONAS DE ENTRENAMIENTO
            </h3>
          </div>
          <p className="text-text-secondary font-mono text-sm">
            Basado en HR máxima estimada: {maxHR} bpm
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zoneDataWithPercent.map(zone => (
            <ZoneCard 
              key={zone.name} 
              zone={zone} 
              ideal={idealDistribution[zone.name]} 
            />
          ))}
        </div>

        {/* Resumen de distribución */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
          <h4 className="font-mono font-bold text-text-primary mb-3">
            RESUMEN DE DISTRIBUCIÓN
          </h4>
          <div className="space-y-2">
            {zoneDataWithPercent.map(zone => {
              const ideal = idealDistribution[zone.name];
              const diff = zone.percentage - ideal;
              const diffColor = Math.abs(diff) <= 10 ? 'text-accent-lime' : diff > 0 ? 'text-accent-pink' : 'text-accent-cyan';
              
              return (
                <div key={zone.name} className="flex items-center justify-between text-sm font-mono">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="text-text-primary">{zone.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-text-secondary">
                      {zone.percentage}% (ideal: {ideal}%)
                    </span>
                    <span className={diffColor}>
                      {diff > 0 ? '+' : ''}{diff}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recomendación general */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
          <p className="font-mono text-sm text-text-primary">
            💡 <span className="text-accent-lime">Pirámide de entrenamiento:</span> 80% en Zonas 1-3 (base), 15% en Zona 4 (umbral), 5% en Zona 5 (VO2 Max)
          </p>
        </div>
      </div>
    </Card>
  );
};
