import { Card } from '../ui/Card';
import { formatDistance, formatTime } from '../../utils/formatters';

export const QuickStats = ({ activities }) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Esta semana
  const thisWeekActivities = activities.filter(
    a => new Date(a.startDate) >= weekAgo
  );
  const thisWeekDistance = thisWeekActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);
  const thisWeekTime = thisWeekActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);

  // Este mes
  const thisMonthActivities = activities.filter(
    a => new Date(a.startDate) >= monthAgo
  );
  const thisMonthDistance = thisMonthActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);
  const thisMonthTime = thisMonthActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);

  // Récord personal - distancia más larga
  const longestActivity = activities.reduce((max, a) => 
    (a.distanceKm || 0) > (max.distanceKm || 0) ? a : max, 
    { distanceKm: 0, name: 'N/A' }
  );

  // Récord personal - pace más rápido (solo Run)
  const runActivities = activities.filter(a => a.type === 'RUN');
  const fastestRun = runActivities.reduce((min, a) => {
    const pace = a.movingTime > 0 ? (a.distanceKm || 0) / (a.movingTime / 3600) : Infinity;
    const minPace = min.movingTime > 0 ? (min.distanceKm || 0) / (min.movingTime / 3600) : Infinity;
    return pace < minPace ? a : min;
  }, { distanceKm: 0, movingTime: 0, name: 'N/A' });

  // Racha actual - días consecutivos con actividad
  const streak = calculateStreak(activities);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Esta semana */}
      <Card neon>
        <div className="space-y-2">
          <p className="label-text">ESTA SEMANA</p>
          <p className="stat-number neon-text-cyan">{formatDistance(thisWeekDistance)}</p>
          <p className="text-text-secondary font-mono text-sm">km</p>
          <p className="text-text-secondary font-mono text-xs mt-1">
            {thisWeekActivities.length} actividades
          </p>
        </div>
      </Card>

      {/* Este mes */}
      <Card neon>
        <div className="space-y-2">
          <p className="label-text">ESTE MES</p>
          <p className="stat-number neon-text-lime">{formatDistance(thisMonthDistance)}</p>
          <p className="text-text-secondary font-mono text-sm">km</p>
          <p className="text-text-secondary font-mono text-xs mt-1">
            {thisMonthActivities.length} actividades
          </p>
        </div>
      </Card>

      {/* Récord distancia */}
      <Card neon>
        <div className="space-y-2">
          <p className="label-text">RÉCORD DISTANCIA</p>
          <p className="stat-number neon-text-gold">{formatDistance(longestActivity.distanceKm)}</p>
          <p className="text-text-secondary font-mono text-sm">km</p>
          <p className="text-text-secondary font-mono text-xs mt-1 truncate">
            {longestActivity.name}
          </p>
        </div>
      </Card>

      {/* Racha */}
      <Card neon>
        <div className="space-y-2">
          <p className="label-text">RACHA ACTUAL</p>
          <p className="stat-number neon-text-pink">{streak}</p>
          <p className="text-text-secondary font-mono text-sm">días</p>
          <p className="text-text-secondary font-mono text-xs mt-1">
            {streak > 0 ? '¡Sigue así!' : 'Sin racha'}
          </p>
        </div>
      </Card>
    </div>
  );
};

function calculateStreak(activities) {
  if (activities.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Obtener fechas únicas de actividades
  const activityDates = activities
    .map(a => {
      const date = new Date(a.startDate);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .sort((a, b) => b - a); // Ordenar descendente

  let streak = 0;
  let currentDate = today.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  for (const date of activityDates) {
    if (date === currentDate) {
      streak++;
      currentDate -= oneDay;
    } else if (date === currentDate - oneDay) {
      // Actividad de ayer, continuar
      currentDate -= oneDay;
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
