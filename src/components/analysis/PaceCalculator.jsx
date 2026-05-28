import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Sliders, Activity, Target, Zap, Flame, Award, HelpCircle } from 'lucide-react';

export const PaceCalculator = ({ activities }) => {
  // Filtrar solo carreras (Run) con datos de distancia y tiempo
  const runs = activities.filter(
    a => a.type === 'RUN' && a.distanceKm > 0 && a.movingTime > 0
  );

  const calculateVDOT = (distanceKm, timeSeconds) => {
    const velocityMPerMin = (distanceKm * 1000) / (timeSeconds / 60);
    const timeMin = timeSeconds / 60;
    
    const term1 = Math.exp(-0.012778 * timeMin);
    const term2 = Math.exp(-0.1932605 * timeMin);
    
    const vdot = (velocityMPerMin * (0.8 + 0.1894393 * term1) + 0.2989558 * term2) / (1 + term1);
    return vdot;
  };

  // Calcular VDOT promedio de las últimas 10 carreras
  const recentRuns = runs.slice(0, 10);
  const vdotValues = recentRuns.map(r => calculateVDOT(r.distanceKm, r.movingTime));
  const calculatedAvgVDOT = vdotValues.length > 0
    ? vdotValues.reduce((sum, v) => sum + v, 0) / vdotValues.length
    : 40.0;

  // Estado para el VDOT (por defecto el calculado o 40)
  const [vdot, setVdot] = useState(parseFloat(calculatedAvgVDOT.toFixed(1)));

  // Sincronizar si cambian las actividades
  useEffect(() => {
    if (vdotValues.length > 0) {
      setVdot(parseFloat(calculatedAvgVDOT.toFixed(1)));
    }
  }, [calculatedAvgVDOT, activities]);

  // Formatear ritmo decimal (min/km) a MM:SS
  const formatDecimalPace = (paceDecimal) => {
    if (isNaN(paceDecimal) || paceDecimal === Infinity) return '--:--';
    let minutes = Math.floor(paceDecimal);
    let seconds = Math.round((paceDecimal - minutes) * 60);
    if (seconds === 60) {
      minutes += 1;
      seconds = 0;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Zonas de ritmo según Jack Daniels
  // Fácil (E) = 60 / (VDOT * 0.28)
  // Maratón (M) = 60 / (VDOT * 0.34)
  // Umbral (T) = 60 / (VDOT * 0.38)
  // Intervalos (I) = 60 / (VDOT * 0.43)
  // Repeticiones (R) = 60 / (VDOT * 0.48)
  const paceZones = [
    {
      id: 'easy',
      name: 'Fácil (Easy - E)',
      color: '#00D4FF',
      bgColor: 'rgba(0, 212, 255, 0.1)',
      borderColor: 'border-accent-cyan',
      textColor: 'text-accent-cyan',
      icon: Activity,
      fcRange: '60% - 79% FC Máx',
      effort: '2 - 4 / 10',
      description: 'Construcción de resistencia aeróbica, capilarización, fortalecimiento muscular/articular y recuperación activa de sesiones intensas.',
      paceMinKm: 60 / (vdot * 0.28),
      getExtraMetrics: (paceDecimal) => [
        { label: 'Ritmo por km', value: `${formatDecimalPace(paceDecimal)} /km` },
        { label: 'Ritmo por milla', value: `${formatDecimalPace(paceDecimal * 1.60934)} /mi` },
        { label: 'Duración típica', value: '30 - 150 min' }
      ]
    },
    {
      id: 'marathon',
      name: 'Maratón (Marathon - M)',
      color: '#94E85D',
      bgColor: 'rgba(148, 232, 93, 0.1)',
      borderColor: 'border-accent-lime',
      textColor: 'text-accent-lime',
      icon: Award,
      fcRange: '80% - 85% FC Máx',
      effort: '5 - 6 / 10',
      description: 'Ritmo sostenido y aeróbico. Optimiza el consumo de glucógeno, simula las condiciones del día de la carrera y fortalece la confianza mental.',
      paceMinKm: 60 / (vdot * 0.34),
      getExtraMetrics: (paceDecimal) => [
        { label: 'Ritmo por km', value: `${formatDecimalPace(paceDecimal)} /km` },
        { label: 'Tiempo 10K', value: formatDecimalPace(paceDecimal * 10) },
        { label: 'Tiempo 21.1K', value: formatDecimalPace(paceDecimal * 21.1) }
      ]
    },
    {
      id: 'threshold',
      name: 'Umbral (Threshold - T)',
      color: '#FFB000',
      bgColor: 'rgba(255, 176, 0, 0.1)',
      borderColor: 'border-accent-gold',
      textColor: 'text-accent-gold',
      icon: Target,
      fcRange: '88% - 92% FC Máx',
      effort: '7 - 8 / 10',
      description: 'Entrenamiento del umbral de lactato ("tempo run"). Aumenta la velocidad que puedes mantener sin acumulación excesiva de ácido láctico.',
      paceMinKm: 60 / (vdot * 0.38),
      getExtraMetrics: (paceDecimal) => [
        { label: 'Ritmo por km', value: `${formatDecimalPace(paceDecimal)} /km` },
        { label: 'Paso por 1000m', value: formatDecimalPace(paceDecimal) },
        { label: 'Paso por 400m', value: formatDecimalPace(paceDecimal * 0.4) }
      ]
    },
    {
      id: 'intervals',
      name: 'Intervalos (Intervals - I)',
      color: '#FF5B8C',
      bgColor: 'rgba(255, 91, 140, 0.1)',
      borderColor: 'border-accent-pink',
      textColor: 'text-accent-pink',
      icon: Zap,
      fcRange: '95% - 100% FC Máx',
      effort: '9 / 10',
      description: 'Desarrollo de la capacidad aeróbica máxima (VO2 Máx). Esfuerzos de 3 a 5 minutos para maximizar el bombeo de oxígeno a los músculos.',
      paceMinKm: 60 / (vdot * 0.43),
      getExtraMetrics: (paceDecimal) => [
        { label: 'Ritmo por km', value: `${formatDecimalPace(paceDecimal)} /km` },
        { label: '1000m Rep', value: formatDecimalPace(paceDecimal) },
        { label: '400m Rep', value: formatDecimalPace(paceDecimal * 0.4) }
      ]
    },
    {
      id: 'repetitions',
      name: 'Repeticiones (Repetitions - R)',
      color: '#C084FC',
      bgColor: 'rgba(192, 132, 252, 0.1)',
      borderColor: 'border-accent-purple',
      textColor: 'text-accent-purple',
      icon: Flame,
      fcRange: 'N/A (Anaeróbico)',
      effort: '10 / 10',
      description: 'Mejora de la economía de carrera, la velocidad pura y el reclutamiento neuromuscular. Consiste en repeticiones cortas con recuperación completa.',
      paceMinKm: 60 / (vdot * 0.48),
      getExtraMetrics: (paceDecimal) => [
        { label: '400m Rep', value: formatDecimalPace(paceDecimal * 0.4) },
        { label: '300m Rep', value: formatDecimalPace(paceDecimal * 0.3) },
        { label: '200m Rep', value: formatDecimalPace(paceDecimal * 0.2) }
      ]
    }
  ];

  return (
    <Card>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="text-accent-cyan" size={18} />
            <h3 className="font-mono font-bold text-text-primary text-sm sm:text-base uppercase">
              CALCULADORA DE RITMOS DANIELS (VDOT)
            </h3>
          </div>
          <p className="text-text-secondary font-mono text-xs">
            Calcula tus ritmos ideales de entrenamiento basándote en la fórmula VDOT de Jack Daniels. Puedes usar el valor calculado de tus últimas carreras o ajustarlo manualmente.
          </p>
        </div>

        {/* VDOT Selector Panel */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-text-primary">
                Índice VDOT de Rendimiento
              </p>
              {recentRuns.length > 0 ? (
                <p className="text-text-secondary text-xs font-mono">
                  Promedio de tus últimas carreras: <span className="text-accent-cyan font-bold">{calculatedAvgVDOT.toFixed(1)}</span>
                </p>
              ) : (
                <p className="text-text-secondary text-xs font-mono">
                  Sin carreras recientes. Ajusta tu VDOT estimado abajo.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 bg-panel-bg-solid px-4 py-2 rounded-lg border border-border-primary self-start sm:self-center">
              <span className="text-text-secondary text-xs font-mono">VDOT ACTUAL</span>
              <span className="font-mono font-bold text-lg text-accent-cyan">{vdot.toFixed(1)}</span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="30"
              max="85"
              step="0.5"
              value={vdot}
              onChange={(e) => setVdot(parseFloat(e.target.value))}
              className="w-full h-2 bg-border-primary rounded-lg appearance-none cursor-pointer accent-accent-cyan focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-text-secondary font-mono">
              <span>30.0 (Recreativo)</span>
              <span>50.0 (Avanzado)</span>
              <span>70.0 (Elite)</span>
              <span>85.0 (Olímpico)</span>
            </div>
          </div>
        </div>

        {/* Pace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paceZones.map((zone) => {
            const ZoneIcon = zone.icon;
            return (
              <div
                key={zone.id}
                className="bg-panel-bg border border-border-primary rounded-lg p-4 space-y-3 flex flex-col justify-between hover:border-text-secondary transition-all"
                style={{
                  borderLeft: `4px solid ${zone.color}`
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <ZoneIcon size={16} style={{ color: zone.color }} />
                      <h4 className="font-mono font-bold text-text-primary text-sm">
                        {zone.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-text-primary">
                      {formatDecimalPace(zone.paceMinKm)}
                    </span>
                    <span className="text-text-secondary text-xs font-mono">min/km</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                    <span className={`px-2 py-0.5 rounded ${zone.textColor}`} style={{ backgroundColor: zone.bgColor }}>
                      {zone.fcRange}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-panel-bg-solid text-text-secondary border border-border-primary">
                      Esfuerzo: {zone.effort}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed font-mono">
                    {zone.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border-primary space-y-2 mt-auto">
                  <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider font-bold">
                    Referencias de Ritmo:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {zone.getExtraMetrics(zone.paceMinKm).map((metric, idx) => (
                      <div key={idx} className="bg-panel-bg-solid p-1.5 rounded border border-border-primary text-center">
                        <span className="block text-[8px] text-text-secondary font-mono truncate uppercase">
                          {metric.label}
                        </span>
                        <span className="font-mono text-xs font-bold text-text-primary truncate block">
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip / VDOT Guide */}
        <div className="bg-panel-bg border border-border-primary rounded-lg p-4 flex gap-3 items-start">
          <HelpCircle className="text-accent-gold flex-shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <h5 className="font-mono font-bold text-xs text-text-primary uppercase">
              ¿Cómo entrenar con estos ritmos?
            </h5>
            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              Usa el ritmo <span className="text-accent-cyan font-bold">Fácil</span> para el 80% de tu volumen semanal. El ritmo <span className="text-accent-lime font-bold">Maratón</span> es ideal para tiradas largas específicas. El ritmo de <span className="text-accent-gold font-bold">Umbral</span> es tu ritmo máximo sostenible por una hora. Realiza los <span className="text-accent-pink font-bold">Intervalos</span> y <span className="text-accent-purple font-bold">Repeticiones</span> en sesiones dedicadas de pista o pasadas, asegurando el descanso adecuado entre series.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
