import { Card } from '../ui/Card';
import { Target, TrendingUp } from 'lucide-react';
import { formatTime, formatPace } from '../../utils/formatters';

export const RacePredictor = ({ activities }) => {
  // Filtrar solo carreras (Run) con datos de distancia y tiempo
  const runs = activities.filter(
    a => a.type === 'RUN' && a.distanceKm > 0 && a.movingTime > 0
  );

  if (runs.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono">
            Se necesitan datos de carreras para calcular predicciones
          </p>
        </div>
      </Card>
    );
  }

  // Calcular VDOT (Velocity at VO2 Max) usando la fórmula de Jack Daniels
  // VDOT = (v * (0.8 + 0.1894393 * e^(-0.012778 * t)) + 0.2989558 * e^(-0.1932605 * t)) / (1 + e^(-0.012778 * t))
  // Donde v = velocidad en m/min, t = tiempo en minutos
  
  const calculateVDOT = (distanceKm, timeSeconds) => {
    const velocityMPerMin = (distanceKm * 1000) / (timeSeconds / 60);
    const timeMin = timeSeconds / 60;
    
    const term1 = Math.exp(-0.012778 * timeMin);
    const term2 = Math.exp(-0.1932605 * timeMin);
    
    const vdot = (velocityMPerMin * (0.8 + 0.1894393 * term1) + 0.2989558 * term2) / (1 + term1);
    return vdot;
  };

  // Calcular VDOT promedio de las últimas 10 carreras
  const recentRuns = runs.slice(-10);
  const vdotValues = recentRuns.map(r => calculateVDOT(r.distanceKm, r.movingTime));
  const avgVDOT = vdotValues.reduce((sum, v) => sum + v, 0) / vdotValues.length;

  // Predecir tiempos para diferentes distancias usando VDOT
  const predictTime = (distanceKm, vdot) => {
    // Fórmula inversa para calcular tiempo a partir de VDOT
    // Simplificación: usar tabla de Jack Daniels
    const paceTable = {
      5: { minVDOT: 30, maxVDOT: 80 },
      10: { minVDOT: 30, maxVDOT: 80 },
      21.1: { minVDOT: 30, maxVDOT: 80 },
      42.2: { minVDOT: 30, maxVDOT: 80 }
    };

    // Estimar pace (min/km) basado en VDOT
    // Pace ≈ 60 / (VDOT * 0.4) (simplificación)
    const paceMinPerKm = 60 / (vdot * 0.4);
    const totalTimeMin = paceMinPerKm * distanceKm;
    return totalTimeMin * 60; // segundos
  };

  const predictions = [
    { distance: 5, name: '5K', unit: 'km' },
    { distance: 10, name: '10K', unit: 'km' },
    { distance: 21.1, name: '21K', unit: 'km' },
    { distance: 42.2, name: '42K', unit: 'km' }
  ].map(race => ({
    ...race,
    predictedTime: predictTime(race.distance, avgVDOT),
    predictedPace: predictTime(race.distance, avgVDOT) / race.distance / 60
  }));

  // Encontrar mejor tiempo real para cada distancia
  const bestTimes = predictions.map(race => {
    const raceActivities = runs.filter(
      r => Math.abs(r.distanceKm - race.distance) < 1 // ±1km tolerance
    );
    const best = raceActivities.length > 0
      ? raceActivities.reduce((min, r) => r.movingTime < min.movingTime ? r : min)
      : null;
    
    return {
      ...race,
      bestTime: best?.movingTime || null,
      bestPace: best ? (best.movingTime / best.distanceKm / 60) : null
    };
  });

  return (
    <Card>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Target size={16} className="text-accent-lime" />
            <h3 className="font-mono font-bold text-text-primary text-sm sm:text-base">
              PREDICCIÓN DE TIEMPOS
            </h3>
          </div>
          <p className="text-text-secondary font-mono text-xs sm:text-sm">
            VDOT promedio: {avgVDOT.toFixed(1)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {bestTimes.map((race) => (
            <div key={race.name} className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h4 className="font-mono font-bold text-text-primary text-sm sm:text-base">
                  {race.name}
                </h4>
                <TrendingUp size={14} className="text-accent-lime" />
              </div>

              <div className="space-y-2 sm:space-y-3">
                {/* Predicción */}
                <div>
                  <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
                    Tiempo predicho
                  </p>
                  <p className="font-mono text-base sm:text-lg text-accent-lime font-bold">
                    {formatTime(race.predictedTime)}
                  </p>
                  <p className="text-text-secondary font-mono text-[10px] sm:text-xs">
                    Pace: {formatPace(1, race.predictedPace * 60)} min/km
                  </p>
                </div>

                {/* Mejor tiempo real */}
                {race.bestTime ? (
                  <div className="pt-2 sm:pt-3 border-t border-border-primary">
                    <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1">
                      Mejor tiempo real
                    </p>
                    <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
                      {formatTime(race.bestTime)}
                    </p>
                    <p className="text-text-secondary font-mono text-[10px] sm:text-xs">
                      Pace: {formatPace(1, race.bestPace * 60)} min/km
                    </p>
                  </div>
                ) : (
                  <div className="pt-2 sm:pt-3 border-t border-border-primary">
                    <p className="text-text-secondary font-mono text-[10px] sm:text-xs">
                      Sin datos de {race.name}
                    </p>
                  </div>
                )}

                {/* Comparación */}
                {race.bestTime && (
                  <div className="pt-2 sm:pt-3 border-t border-border-primary">
                    <p className="text-text-secondary font-mono text-[10px] sm:text-xs">
                      Diferencia
                    </p>
                    <p className={`font-mono text-xs sm:text-sm font-bold ${
                      race.predictedTime < race.bestTime ? 'text-accent-lime' : 'text-accent-pink'
                    }`}>
                      {race.predictedTime < race.bestTime ? '↑ ' : '↓ '}
                      {formatTime(Math.abs(race.predictedTime - race.bestTime))}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
          <p className="font-mono text-xs sm:text-sm text-text-secondary">
            <span className="text-text-primary">Tip:</span> Entrena consistentemente para mejorar tu VDOT.
          </p>
        </div>
      </div>
    </Card>
  );
};
