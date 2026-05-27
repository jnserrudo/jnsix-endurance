import { Card } from '../ui/Card';
import { MapPin, TrendingUp, Clock } from 'lucide-react';
import { formatDistance, formatTime } from '../../utils/formatters';

export const SegmentComparison = ({ activities }) => {
  // Filtrar actividades con datos de ubicación
  const activitiesWithLocation = activities.filter(
    a => a.rawData && a.rawData.start_latlng
  );

  if (activitiesWithLocation.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            Se necesitan actividades con datos de ubicación para comparar segmentos
          </p>
        </div>
      </Card>
    );
  }

  // Agrupar actividades por ubicación aproximada (primeros 2 decimales de lat/lng)
  const groupByLocation = (acts) => {
    const groups = {};
    acts.forEach(a => {
      const coords = a.rawData.start_latlng;
      if (coords && coords.length >= 2) {
        const lat = coords[0].toFixed(2);
        const lng = coords[1].toFixed(2);
        const key = `${lat},${lng}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(a);
      }
    });
    return groups;
  };

  const locationGroups = groupByLocation(activitiesWithLocation);

  // Encontrar segmentos repetidos (mismas rutas)
  const repeatedSegments = Object.entries(locationGroups)
    .filter(([_, acts]) => acts.length >= 2)
    .map(([location, acts]) => ({
      location,
      activities: acts.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)),
      count: acts.length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (repeatedSegments.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            No hay segmentos repetidos para comparar
          </p>
        </div>
      </Card>
    );
  }

  const SegmentCard = ({ segment }) => {
    const bestActivity = segment.activities.reduce((best, act) => {
      const bestPace = best.movingTime > 0 ? (best.distanceKm || 0) / (best.movingTime / 3600) : 0;
      const actPace = act.movingTime > 0 ? (act.distanceKm || 0) / (act.movingTime / 3600) : 0;
      return actPace > bestPace ? act : best;
    }, segment.activities[0]);

    const worstActivity = segment.activities.reduce((worst, act) => {
      const worstPace = worst.movingTime > 0 ? (worst.distanceKm || 0) / (worst.movingTime / 3600) : Infinity;
      const actPace = act.movingTime > 0 ? (act.distanceKm || 0) / (act.movingTime / 3600) : Infinity;
      return actPace < worstPace ? act : worst;
    }, segment.activities[0]);

    const avgDistance = segment.activities.reduce((sum, a) => sum + (a.distanceKm || 0), 0) / segment.activities.length;
    const avgTime = segment.activities.reduce((sum, a) => sum + (a.movingTime || 0), 0) / segment.activities.length;

    const bestPace = bestActivity.movingTime > 0 ? (bestActivity.distanceKm || 0) / (bestActivity.movingTime / 3600) : 0;
    const worstPace = worstActivity.movingTime > 0 ? (worstActivity.distanceKm || 0) / (worstActivity.movingTime / 3600) : 0;
    const improvement = worstPace > 0 ? ((bestPace - worstPace) / worstPace * 100) : 0;

    return (
      <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-accent-lime" />
            <h4 className="font-mono font-bold text-text-primary">
              Segmento {segment.location}
            </h4>
          </div>
          <span className="text-text-secondary font-mono text-sm">
            {segment.count} repeticiones
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <p className="text-text-secondary font-mono text-xs mb-1">
              Mejor tiempo
            </p>
            <p className="font-mono text-sm text-accent-lime font-bold">
              {formatTime(bestActivity.movingTime)}
            </p>
            <p className="text-text-secondary font-mono text-xs">
              {formatDistance(bestActivity.distanceKm)} km
            </p>
          </div>
          <div className="text-center">
            <p className="text-text-secondary font-mono text-xs mb-1">
              Promedio
            </p>
            <p className="font-mono text-sm text-text-primary font-bold">
              {formatTime(avgTime)}
            </p>
            <p className="text-text-secondary font-mono text-xs">
              {formatDistance(avgDistance)} km
            </p>
          </div>
          <div className="text-center">
            <p className="text-text-secondary font-mono text-xs mb-1">
              Mejora
            </p>
            <p className={`font-mono text-sm font-bold ${improvement > 0 ? 'text-accent-lime' : 'text-accent-pink'}`}>
              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
            </p>
            <p className="text-text-secondary font-mono text-xs">
              vs peor
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-text-secondary font-mono text-xs">
            HISTORIAL:
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {segment.activities.map((act, idx) => {
              const pace = act.movingTime > 0 ? (act.distanceKm || 0) / (act.movingTime / 3600) : 0;
              const isBest = act.id === bestActivity.id;
              const isWorst = act.id === worstActivity.id;
              
              return (
                <div 
                  key={act.id} 
                  className={`flex items-center justify-between text-xs font-mono p-2 rounded ${
                    isBest ? 'bg-accent-lime/20' : isWorst ? 'bg-accent-pink/20' : 'bg-panel-bg'
                  }`}
                >
                  <span className={`text-text-primary ${isBest ? 'font-bold' : ''}`}>
                    {act.name || 'Sin nombre'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary">
                      {formatTime(act.movingTime)}
                    </span>
                    <span className="text-text-secondary">
                      {pace.toFixed(1)} km/h
                    </span>
                    {isBest && <span className="text-accent-lime">★</span>}
                  </div>
                </div>
              );
            })}
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
            <MapPin size={20} className="text-accent-lime" />
            <h3 className="font-mono font-bold text-text-primary">
              COMPARACIÓN DE SEGMENTOS
            </h3>
          </div>
          <p className="text-text-secondary font-mono text-sm">
            Segmentos repetidos basados en ubicación de inicio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repeatedSegments.map((segment, idx) => (
            <SegmentCard key={idx} segment={segment} />
          ))}
        </div>

        <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
          <p className="font-mono text-sm text-text-secondary">
            💡 <span className="text-text-primary">Tip:</span> Los segmentos se agrupan por ubicación aproximada de inicio. Compara tus tiempos en las mismas rutas para ver tu progreso.
          </p>
        </div>
      </div>
    </Card>
  );
};
