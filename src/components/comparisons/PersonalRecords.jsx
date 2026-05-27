import { Card } from '../ui/Card';
import { Trophy, Zap, Mountain, Heart } from 'lucide-react';
import { formatDistance, formatTime, formatDate } from '../../utils/formatters';

export const PersonalRecords = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            No hay actividades registradas
          </p>
        </div>
      </Card>
    );
  }

  // Top 10 actividades más largas
  const longestActivities = [...activities]
    .sort((a, b) => (b.distanceKm || 0) - (a.distanceKm || 0))
    .slice(0, 10);

  // Top 10 paces más rápidos (solo Run)
  const runActivities = activities.filter(a => a.type === 'RUN');
  const fastestRuns = runActivities
    .filter(a => a.distanceKm > 0 && a.movingTime > 0)
    .map(a => ({
      ...a,
      pace: (a.movingTime / 60) / a.distanceKm // min/km
    }))
    .sort((a, b) => a.pace - b.pace)
    .slice(0, 10);

  // Top 10 mayor elevación
  const highestElevation = [...activities]
    .sort((a, b) => (b.elevationM || 0) - (a.elevationM || 0))
    .slice(0, 10);

  // Top 10 mayor frecuencia cardíaca promedio
  const highestHR = activities
    .filter(a => a.averageHr && a.averageHr > 0)
    .sort((a, b) => b.averageHr - a.averageHr)
    .slice(0, 10);

  const RecordTable = ({ title, icon: Icon, data, columns, renderRow }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-accent-gold" />
        <h3 className="font-mono font-bold text-text-primary">{title}</h3>
      </div>
      <div className="bg-panel-bg border border-border-primary rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              {columns.map((col, idx) => (
                <th key={idx} className="text-left p-3 font-mono text-sm text-text-secondary">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-text-secondary font-mono text-sm">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              data.map((item, idx) => renderRow(item, idx))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-mono font-bold text-text-primary mb-2">
            RÉCORDS PERSONALES
          </h2>
          <p className="text-text-secondary font-mono text-sm">
            Top 10 en cada categoría
          </p>
        </div>

        {/* Actividades más largas */}
        <RecordTable
          title="DISTANCIA MÁS LARGA"
          icon={Trophy}
          data={longestActivities}
          columns={['#', 'Actividad', 'Fecha', 'Distancia', 'Tiempo']}
          renderRow={(activity, idx) => (
            <tr key={activity.id} className="border-b border-border-primary hover:bg-panel-bg transition-colors">
              <td className="p-3 font-mono text-sm text-accent-gold font-bold">
                #{idx + 1}
              </td>
              <td className="p-3 font-mono text-sm text-text-primary">
                {activity.name || 'Sin título'}
              </td>
              <td className="p-3 font-mono text-sm text-text-secondary">
                {formatDate(activity.startDate)}
              </td>
              <td className="p-3 font-mono text-sm text-accent-pace font-bold">
                {formatDistance(activity.distanceKm)} km
              </td>
              <td className="p-3 font-mono text-sm text-accent-lime">
                {formatTime(activity.movingTime)}
              </td>
            </tr>
          )}
        />

        {/* Paces más rápidos */}
        <RecordTable
          title="PACE MÁS RÁPIDO (RUN)"
          icon={Zap}
          data={fastestRuns}
          columns={['#', 'Actividad', 'Fecha', 'Distancia', 'Pace']}
          renderRow={(activity, idx) => (
            <tr key={activity.id} className="border-b border-border-primary hover:bg-panel-bg transition-colors">
              <td className="p-3 font-mono text-sm text-accent-gold font-bold">
                #{idx + 1}
              </td>
              <td className="p-3 font-mono text-sm text-text-primary">
                {activity.name || 'Sin título'}
              </td>
              <td className="p-3 font-mono text-sm text-text-secondary">
                {formatDate(activity.startDate)}
              </td>
              <td className="p-3 font-mono text-sm text-accent-pace font-bold">
                {formatDistance(activity.distanceKm)} km
              </td>
              <td className="p-3 font-mono text-sm text-accent-lime font-bold">
                {activity.pace.toFixed(1)} min/km
              </td>
            </tr>
          )}
        />

        {/* Mayor elevación */}
        <RecordTable
          title="MAYOR ELEVACIÓN"
          icon={Mountain}
          data={highestElevation}
          columns={['#', 'Actividad', 'Fecha', 'Elevación', 'Distancia']}
          renderRow={(activity, idx) => (
            <tr key={activity.id} className="border-b border-border-primary hover:bg-panel-bg transition-colors">
              <td className="p-3 font-mono text-sm text-accent-gold font-bold">
                #{idx + 1}
              </td>
              <td className="p-3 font-mono text-sm text-text-primary">
                {activity.name || 'Sin título'}
              </td>
              <td className="p-3 font-mono text-sm text-text-secondary">
                {formatDate(activity.startDate)}
              </td>
              <td className="p-3 font-mono text-sm text-accent-gold font-bold">
                {Math.round(activity.elevationM || 0)} m
              </td>
              <td className="p-3 font-mono text-sm text-accent-pace">
                {formatDistance(activity.distanceKm)} km
              </td>
            </tr>
          )}
        />

        {/* Mayor frecuencia cardíaca */}
        <RecordTable
          title="FRECUENCIA CARDÍACA MÁXIMA"
          icon={Heart}
          data={highestHR}
          columns={['#', 'Actividad', 'Fecha', 'HR Promedio', 'HR Máxima']}
          renderRow={(activity, idx) => (
            <tr key={activity.id} className="border-b border-border-primary hover:bg-panel-bg transition-colors">
              <td className="p-3 font-mono text-sm text-accent-gold font-bold">
                #{idx + 1}
              </td>
              <td className="p-3 font-mono text-sm text-text-primary">
                {activity.name || 'Sin título'}
              </td>
              <td className="p-3 font-mono text-sm text-text-secondary">
                {formatDate(activity.startDate)}
              </td>
              <td className="p-3 font-mono text-sm text-accent-pink font-bold">
                {activity.averageHr} bpm
              </td>
              <td className="p-3 font-mono text-sm text-accent-pink">
                {activity.maxHr || '-'} bpm
              </td>
            </tr>
          )}
        />
      </div>
    </Card>
  );
};
