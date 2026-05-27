import { Card } from '../ui/Card';
import { Heart, Droplets, Moon, Zap, Coffee } from 'lucide-react';
import { formatDistance, formatTime } from '../../utils/formatters';

export const RecoveryAdvice = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            Se necesitan datos de actividades para dar recomendaciones de recuperación
          </p>
        </div>
      </Card>
    );
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Actividades de los últimos 7 días
  const recentActivities = activities.filter(
    a => new Date(a.startDate) >= sevenDaysAgo
  );

  // Calcular métricas de carga
  const totalDistance = recentActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);
  const totalTime = recentActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
  const totalElevation = recentActivities.reduce((sum, a) => sum + (a.elevationM || 0), 0);
  const avgHR = recentActivities.length > 0
    ? recentActivities.reduce((sum, a) => sum + (a.averageHr || 0), 0) / recentActivities.length
    : 0;

  // Última actividad
  const lastActivity = recentActivities.length > 0
    ? recentActivities.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0]
    : null;

  const daysSinceLastActivity = lastActivity
    ? Math.floor((now - new Date(lastActivity.startDate)) / (1000 * 60 * 60 * 24))
    : null;

  // Calcular nivel de recuperación
  const calculateRecoveryLevel = () => {
    if (!lastActivity) return { level: 'DESCANSO', color: 'text-accent-cyan', icon: Moon };
    
    if (daysSinceLastActivity >= 3) {
      return { level: 'RECUPERADO', color: 'text-accent-lime', icon: Zap };
    } else if (daysSinceLastActivity >= 1) {
      return { level: 'RECUPERANDO', color: 'text-accent-gold', icon: Heart };
    } else {
      return { level: 'FATIGADO', color: 'text-accent-pink', icon: Coffee };
    }
  };

  const recoveryLevel = calculateRecoveryLevel();
  const RecoveryIcon = recoveryLevel.icon;

  // Generar recomendaciones
  const getRecommendations = () => {
    const recommendations = [];

    // Basado en días desde última actividad
    if (daysSinceLastActivity === 0) {
      recommendations.push({
        icon: Coffee,
        title: 'Descanso activo',
        description: 'Hoy entrenaste. Mañana haz recuperación ligera o descanso completo.',
        priority: 'high'
      });
    } else if (daysSinceLastActivity === 1) {
      recommendations.push({
        icon: Heart,
        title: 'Recuperación moderada',
        description: 'Puedes hacer entrenamiento ligero hoy. Escucha a tu cuerpo.',
        priority: 'medium'
      });
    } else if (daysSinceLastActivity >= 2 && daysSinceLastActivity < 4) {
      recommendations.push({
        icon: Zap,
        title: 'Listo para entrenar',
        description: 'Tu cuerpo está recuperado. Puedes hacer un entrenamiento normal.',
        priority: 'low'
      });
    } else if (daysSinceLastActivity >= 4) {
      recommendations.push({
        icon: Zap,
        title: 'Volver a entrenar',
        description: 'Has descansado suficiente. Es buen momento para retomar.',
        priority: 'high'
      });
    }

    // Basado en carga semanal
    if (totalDistance > 100) {
      recommendations.push({
        icon: Moon,
        title: 'Carga alta',
        description: 'Esta semana has corrido mucho. Considera un día extra de descanso.',
        priority: 'high'
      });
    }

    // Basado en HR promedio
    if (avgHR > 160) {
      recommendations.push({
        icon: Droplets,
        title: 'Hidratación',
        description: 'Tu HR promedio ha sido alta. Asegúrate de hidratarte bien.',
        priority: 'medium'
      });
    }

    // Basado en elevación
    if (totalElevation > 2000) {
      recommendations.push({
        icon: Heart,
        title: 'Recuperación muscular',
        description: 'Mucha elevación esta semana. Considera estiramientos y masajes.',
        priority: 'medium'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  const RecommendationCard = ({ rec }) => {
    const RecIcon = rec.icon;
    const priorityColors = {
      high: 'border-accent-pink',
      medium: 'border-accent-gold',
      low: 'border-accent-lime'
    };

    return (
      <div className={`bg-panel-bg border-2 ${priorityColors[rec.priority]} rounded-lg p-3 sm:p-4`}>
        <div className="flex items-start gap-2 sm:gap-3">
          <RecIcon size={16} className="text-accent-lime flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-mono font-bold text-text-primary mb-1 text-xs sm:text-sm">
              {rec.title}
            </h4>
            <p className="text-text-secondary font-mono text-[10px] sm:text-sm">
              {rec.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Heart size={16} className="text-accent-lime" />
            <h3 className="font-mono font-bold text-text-primary text-sm sm:text-base">
              CONSEJOS DE RECUPERACIÓN
            </h3>
          </div>
          <p className="text-text-secondary font-mono text-xs sm:text-sm">
            Basado en tu actividad reciente
          </p>
        </div>

        {/* Estado de recuperación */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary font-mono text-xs sm:text-sm mb-1">
                ESTADO DE RECUPERACIÓN
              </p>
              <div className="flex items-center gap-2">
                <RecoveryIcon size={20} className={recoveryLevel.color} />
                <p className={`text-2xl sm:text-3xl font-mono font-bold ${recoveryLevel.color}`}>
                  {recoveryLevel.level}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-text-secondary font-mono text-xs sm:text-sm mb-1">
                ÚLTIMA ACTIVIDAD
              </p>
              <p className="text-lg sm:text-xl font-mono font-bold text-text-primary">
                {daysSinceLastActivity !== null ? `${daysSinceLastActivity} días` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de la semana */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4 text-center">
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
              DISTANCIA
            </p>
            <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
              {formatDistance(totalDistance)}
            </p>
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs">km</p>
          </div>
          <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4 text-center">
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
              TIEMPO
            </p>
            <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
              {formatTime(totalTime)}
            </p>
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs">horas</p>
          </div>
          <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4 text-center">
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
              ELEVACIÓN
            </p>
            <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
              {Math.round(totalElevation)}
            </p>
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs">m</p>
          </div>
        </div>

        {/* Recomendaciones */}
        <div>
          <h4 className="font-mono font-bold text-text-primary mb-2 sm:mb-3 text-sm sm:text-base">
            RECOMENDACIONES
          </h4>
          <div className="space-y-2 sm:space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-text-secondary font-mono text-xs sm:text-sm">
                No hay recomendaciones específicas en este momento.
              </p>
            ) : (
              recommendations.map((rec, idx) => (
                <RecommendationCard key={idx} rec={rec} />
              ))
            )}
          </div>
        </div>

        {/* Tips generales */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
          <h4 className="font-mono font-bold text-text-primary mb-2 sm:mb-3 text-sm sm:text-base">
            TIPS GENERALES
          </h4>
          <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-sm font-mono text-text-secondary">
            <div className="flex items-start gap-2">
              <span className="text-accent-lime">•</span>
              <span>Dormir 7-9 horas por noche</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent-lime">•</span>
              <span>Hidratarse bien antes, durante y después</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent-lime">•</span>
              <span>Comer dentro de 30 minutos después del entrenamiento</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent-lime">•</span>
              <span>Hacer estiramientos ligeros después de cada sesión</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent-lime">•</span>
              <span>Escuchar al cuerpo: si hay dolor, descansar</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
