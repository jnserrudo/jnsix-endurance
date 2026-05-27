import { Card } from '../ui/Card';
import { Battery, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatDistance, formatTime } from '../../utils/formatters';

export const FatigueMonitor = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            Se necesitan datos de actividades para monitorear fatiga
          </p>
        </div>
      </Card>
    );
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Actividades de los últimos 7 días
  const recentActivities = activities.filter(
    a => new Date(a.startDate) >= sevenDaysAgo
  );

  // Actividades de los 7 días anteriores (7-14 días atrás)
  const previousActivities = activities.filter(
    a => new Date(a.startDate) >= fourteenDaysAgo && new Date(a.startDate) < sevenDaysAgo
  );

  // Calcular carga de entrenamiento (simplificada: distancia * tiempo)
  const calculateTrainingLoad = (acts) => {
    return acts.reduce((sum, a) => {
      const distance = a.distanceKm || 0;
      const time = a.movingTime || 0;
      return sum + (distance * time);
    }, 0);
  };

  const recentLoad = calculateTrainingLoad(recentActivities);
  const previousLoad = calculateTrainingLoad(previousActivities);

  // Calcular ratio de carga (ACWR - Acute Chronic Workload Ratio)
  // ACWR = Carga aguda (7 días) / Carga crónica (28 días promedio)
  const chronicLoad = calculateTrainingLoad(
    activities.filter(a => new Date(a.startDate) >= new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000))
  ) / 4; // Promedio de 4 semanas

  const acwr = chronicLoad > 0 ? recentLoad / chronicLoad : 0;

  // Calcular distancia total reciente
  const recentDistance = recentActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);
  const previousDistance = previousActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0);

  // Calcular tiempo total reciente
  const recentTime = recentActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
  const previousTime = previousActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);

  // Calcular días de entrenamiento
  const recentDays = new Set(recentActivities.map(a => 
    new Date(a.startDate).toDateString()
  )).size;

  // Determinar nivel de fatiga
  const getFatigueLevel = () => {
    if (acwr > 1.5) return { level: 'CRÍTICO', color: 'text-accent-pink', icon: AlertTriangle };
    if (acwr > 1.3) return { level: 'ALTO', color: 'text-accent-gold', icon: TrendingUp };
    if (acwr > 0.8) return { level: 'MODERADO', color: 'text-accent-lime', icon: Battery };
    return { level: 'BAJO', color: 'text-accent-cyan', icon: TrendingDown };
  };

  const fatigueLevel = getFatigueLevel();
  const FatigueIcon = fatigueLevel.icon;

  // Recomendaciones
  const getRecommendation = () => {
    if (acwr > 1.5) {
      return 'CRITICO: Carga excesiva - Considera días de recuperación inmediatos';
    } else if (acwr > 1.3) {
      return 'ALTO: Carga alta - Reduce intensidad o volumen en los próximos días';
    } else if (acwr > 0.8) {
      return 'OPTIMO: Carga óptima - Mantén el ritmo actual';
    } else {
      return 'BAJO: Carga baja - Puedes aumentar intensidad o volumen';
    }
  };

  // Tendencia de carga
  const loadTrend = recentLoad > previousLoad ? '↑' : '↓';
  const loadTrendColor = recentLoad > previousLoad ? 'text-accent-lime' : 'text-accent-pink';

  return (
    <Card>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Battery size={16} className="text-accent-lime" />
            <h3 className="font-mono font-bold text-text-primary text-sm sm:text-base">
              MONITOR DE FATIGA
            </h3>
          </div>
          <p className="text-text-secondary font-mono text-xs sm:text-sm">
            Basado en ACWR
          </p>
        </div>

        {/* Nivel de fatiga */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary font-mono text-xs sm:text-sm mb-1">
                NIVEL DE FATIGA
              </p>
              <div className="flex items-center gap-2">
                <FatigueIcon size={20} className={fatigueLevel.color} />
                <p className={`text-2xl sm:text-3xl font-mono font-bold ${fatigueLevel.color}`}>
                  {fatigueLevel.level}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-text-secondary font-mono text-xs sm:text-sm mb-1">
                ACWR
              </p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-text-primary">
                {acwr.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Métricas de carga */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
              CARGA (7 días)
            </p>
            <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
              {Math.round(recentLoad)}
            </p>
            <p className={`font-mono text-[10px] sm:text-xs ${loadTrendColor}`}>
              {loadTrend} {Math.round(Math.abs(recentLoad - previousLoad))}
            </p>
          </div>

          <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
              DISTANCIA
            </p>
            <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
              {formatDistance(recentDistance)}
            </p>
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs">km</p>
          </div>

          <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
              TIEMPO
            </p>
            <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
              {formatTime(recentTime)}
            </p>
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs">horas</p>
          </div>

          <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
              DÍAS ENTRENADOS
            </p>
            <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
              {recentDays}/7
            </p>
            <p className="text-text-secondary font-mono text-[10px] sm:text-xs">días</p>
          </div>
        </div>

        {/* Recomendación */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
          <p className="font-mono text-xs sm:text-sm text-text-primary">
            {getRecommendation()}
          </p>
        </div>

        {/* Guía de ACWR */}
        <div className="space-y-2">
          <p className="text-text-secondary font-mono text-[10px] sm:text-xs">
            GUÍA DE ACWR:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent-cyan rounded" />
              <span className="text-text-secondary">0.8 - 1.3: Óptimo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent-lime rounded" />
              <span className="text-text-secondary">1.3 - 1.5: Moderado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent-gold rounded" />
              <span className="text-text-secondary">1.5 - 1.8: Alto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-accent-pink rounded" />
              <span className="text-text-secondary">&gt; 1.8: Crítico</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
