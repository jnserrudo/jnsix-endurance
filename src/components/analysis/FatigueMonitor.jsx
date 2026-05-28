import { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Battery, TrendingUp, TrendingDown, AlertTriangle, Zap, Shield, Sparkles } from 'lucide-react';
import { formatDistance, formatTime } from '../../utils/formatters';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

// Estimate Training Stress Score (TSS) for an activity
const estimateTSS = (activity) => {
  const durationHours = (activity.movingTime || 0) / 3600;
  if (durationHours <= 0) return 0;

  // 1. If Heart Rate is available, calculate hrTSS
  if (activity.averageHr) {
    const lthr = 160; // Estimated Lactate Threshold Heart Rate
    const intensityFactor = activity.averageHr / lthr;
    // hrTSS = durationHours * IF^2 * 100
    return Math.min(250, Math.round(durationHours * Math.pow(intensityFactor, 2) * 100));
  }

  // 2. Fallback using speed by activity type
  let intensityFactor = 0.7; // default IF
  const distance = activity.distanceKm || 0;
  if (distance > 0 && durationHours > 0) {
    const speed = distance / durationHours; // km/h
    if (activity.type === 'RUN' || activity.type === 'TRAIL_RUN' || activity.type === 'VIRTUAL_RUN') {
      // Running reference: 10 km/h is roughly IF 0.8
      intensityFactor = Math.min(1.2, Math.max(0.5, speed / 11));
    } else if (activity.type === 'RIDE' || activity.type === 'VIRTUAL_RIDE') {
      // Riding reference: 25 km/h is roughly IF 0.75
      intensityFactor = Math.min(1.1, Math.max(0.4, speed / 27));
    } else if (activity.type === 'SWIM') {
      intensityFactor = 0.85;
    }
  }

  // 3. Add elevation factor bonus
  const elevation = activity.elevationM || 0;
  if (elevation > 0) {
    const elevationBonus = Math.min(0.2, (elevation / 1000) * 0.1); // Up to +20% for 2000m climb
    intensityFactor += elevationBonus;
  }

  return Math.min(250, Math.round(durationHours * Math.pow(intensityFactor, 2) * 100));
};

export const FatigueMonitor = ({ activities }) => {
  const [timeRange, setTimeRange] = useState(90); // 30, 90, 180 days
  const [activeSubTab, setActiveSubTab] = useState('ctl'); // 'ctl' or 'acwr'

  const timelineData = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    // Sort by date ascending
    const sorted = [...activities].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const earliestDate = new Date(sorted[0].startDate);
    const today = new Date();

    // Start simulation either 180 days ago or at the earliest activity, whichever is earlier,
    // to warm up CTL/ATL calculations so they are stable when displayed in the filtered window.
    const startOffset = 180 * 24 * 60 * 60 * 1000;
    let startDate = new Date(today.getTime() - startOffset);
    if (earliestDate < startDate) {
      startDate = earliestDate;
    }

    // Normalize to midnight
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Map date string (YYYY-MM-DD) -> sum of TSS
    const tssMap = {};
    sorted.forEach(act => {
      const d = new Date(act.startDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const tss = estimateTSS(act);
      tssMap[key] = (tssMap[key] || 0) + tss;
    });

    const data = [];
    let ctl = 0;
    let atl = 0;

    const cur = new Date(start);
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      const tss = tssMap[key] || 0;

      // Exponential Weighted Moving Averages (EWMA)
      // CTL (Fitness): 42-day time constant
      const kCTL = 1 - Math.exp(-1 / 42);
      // ATL (Fatigue): 7-day time constant
      const kATL = 1 - Math.exp(-1 / 7);

      ctl = ctl * (1 - kCTL) + tss * kCTL;
      atl = atl * (1 - kATL) + tss * kATL;
      const tsb = ctl - atl; // TSB (Form) = Fitness - Fatigue

      data.push({
        dateKey: key,
        dateStr: cur.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        TSS: tss,
        CTL: Math.round(ctl * 10) / 10,
        ATL: Math.round(atl * 10) / 10,
        TSB: Math.round(tsb * 10) / 10
      });

      cur.setDate(cur.getDate() + 1);
    }

    return data;
  }, [activities]);

  // Filter last N days for visualization
  const filteredData = useMemo(() => {
    return timelineData.slice(-timeRange);
  }, [timelineData, timeRange]);

  // Current stats (today's values)
  const currentStats = useMemo(() => {
    if (timelineData.length === 0) return { CTL: 0, ATL: 0, TSB: 0, TSS: 0 };
    return timelineData[timelineData.length - 1];
  }, [timelineData]);

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary font-mono text-sm">
            Se necesitan datos de actividades para monitorear fatiga.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate ACWR (Acute Chronic Workload Ratio) based on timeline
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentActivities = activities.filter(a => new Date(a.startDate) >= sevenDaysAgo);
  const previousActivities = activities.filter(a => new Date(a.startDate) >= fourteenDaysAgo && new Date(a.startDate) < sevenDaysAgo);

  const calculateSimpleLoad = (acts) => {
    return acts.reduce((sum, a) => {
      const distance = a.distanceKm || 0;
      const time = (a.movingTime || 0) / 60; // minutes
      return sum + (distance * time);
    }, 0);
  };

  const recentLoad = calculateSimpleLoad(recentActivities);
  const previousLoad = calculateSimpleLoad(previousActivities);
  const chronicLoad = calculateSimpleLoad(
    activities.filter(a => new Date(a.startDate) >= new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000))
  ) / 4;

  const acwr = chronicLoad > 0 ? recentLoad / chronicLoad : 0;

  const getFatigueLevel = () => {
    if (acwr > 1.5) return { level: 'CRÍTICO', color: 'text-accent-pink', icon: AlertTriangle };
    if (acwr > 1.3) return { level: 'ALTO', color: 'text-accent-gold', icon: TrendingUp };
    if (acwr > 0.8) return { level: 'MODERADO', color: 'text-accent-lime', icon: Battery };
    return { level: 'BAJO', color: 'text-accent-cyan', icon: TrendingDown };
  };

  const fatigueLevel = getFatigueLevel();
  const FatigueIcon = fatigueLevel.icon;

  const getRecommendation = () => {
    if (acwr > 1.5) {
      return 'CRÍTICO: Carga de entrenamiento excesiva. Considera reducir drásticamente el volumen o tomar días de descanso absoluto para evitar lesiones.';
    } else if (acwr > 1.3) {
      return 'ALTO: Fatiga elevada. Estás en la zona límite. Es recomendable programar una semana de descarga o entrenamientos suaves.';
    } else if (acwr > 0.8) {
      return 'ÓPTIMO: Relación de carga ideal. Estás asimilando bien el entrenamiento. Excelente zona para continuar progresando de forma segura.';
    } else {
      return 'BAJO: Estímulo insuficiente para adaptaciones significativas. Puedes aumentar el volumen o la intensidad progresivamente.';
    }
  };

  const getTSBStatus = (tsb) => {
    if (tsb < -30) return { status: 'Sobrecarga Alta', desc: 'Riesgo de lesión / Sobreentrenamiento', color: 'text-accent-pink' };
    if (tsb >= -30 && tsb < -10) return { status: 'Entrenamiento Óptimo', desc: 'Zona productiva de adaptación', color: 'text-accent-lime' };
    if (tsb >= -10 && tsb <= 5) return { status: 'Mantenimiento / Transición', desc: 'Carga de asimilación neutra', color: 'text-accent-cyan' };
    return { status: 'Frescura / Tapering', desc: 'Listo para competir o testear', color: 'text-accent-gold' };
  };

  const tsbInfo = getTSBStatus(currentStats.TSB);

  // Custom tooltips inside Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const info = getTSBStatus(data.TSB);
      return (
        <div className="bg-[#151A23] border border-border-primary p-3 rounded-lg font-mono text-xs shadow-2xl space-y-1">
          <p className="text-text-primary font-bold border-b border-border-secondary pb-1 mb-1">{data.dateKey}</p>
          <p className="text-accent-cyan flex justify-between gap-4">
            <span>Fitness (CTL):</span> 
            <span className="font-bold">{data.CTL}</span>
          </p>
          <p className="text-accent-pink flex justify-between gap-4">
            <span>Fatiga (ATL):</span> 
            <span className="font-bold">{data.ATL}</span>
          </p>
          <p className={`${info.color} flex justify-between gap-4`}>
            <span>Forma (TSB):</span> 
            <span className="font-bold">{data.TSB}</span>
          </p>
          <p className="text-text-muted text-[10px] italic">{info.status}</p>
          {data.TSS > 0 && (
            <p className="text-accent-gold flex justify-between gap-4 border-t border-border-secondary pt-1 mt-1">
              <span>Carga del día:</span>
              <span className="font-bold">{data.TSS} TSS</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calcular rango de fechas del historial analizado
  let timelineRangeText = "";
  if (timelineData.length > 0) {
    const firstDay = timelineData[0].dateKey;
    const lastDay = timelineData[timelineData.length - 1].dateKey;
    
    const formatDateKey = (key) => {
      const parts = key.split('-');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
    };
    timelineRangeText = ` (${formatDateKey(firstDay)} - ${formatDateKey(lastDay)})`;
  }

  return (
    <Card>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-accent-cyan" />
              <h3 className="font-mono font-bold text-text-primary text-sm sm:text-base uppercase">
                MONITOR DE FATIGA Y CARGA
              </h3>
            </div>
            <p className="text-text-secondary font-mono text-xs">
              Métricas de Carga Crónica (CTL) y Aguda (ATL){timelineRangeText}
            </p>
          </div>

          {/* Sub-tabs selector - Mobile Optimized */}
          <div className="flex bg-panel-bg border border-border-primary p-1 rounded-lg">
            <button
              onClick={() => setActiveSubTab('ctl')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all ${
                activeSubTab === 'ctl'
                  ? 'bg-accent-cyan text-app-bg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              CTL/ATL/TSB
            </button>
            <button
              onClick={() => setActiveSubTab('acwr')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all ${
                activeSubTab === 'acwr'
                  ? 'bg-accent-cyan text-app-bg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              RATIO ACWR
            </button>
          </div>
        </div>

        {activeSubTab === 'ctl' ? (
          <div className="space-y-6">
            {/* Target values */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4 text-center">
                <p className="text-text-muted font-mono text-[9px] sm:text-xs mb-1">
                  FITNESS (CTL)
                </p>
                <p className="font-mono text-xl sm:text-3xl font-bold text-accent-cyan">
                  {currentStats.CTL}
                </p>
                <p className="text-text-secondary font-mono text-[9px] sm:text-[10px] mt-1">
                  Carga Crónica (42d)
                </p>
              </div>

              <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4 text-center">
                <p className="text-text-muted font-mono text-[9px] sm:text-xs mb-1">
                  FATIGA (ATL)
                </p>
                <p className="font-mono text-xl sm:text-3xl font-bold text-accent-pink">
                  {currentStats.ATL}
                </p>
                <p className="text-text-secondary font-mono text-[9px] sm:text-[10px] mt-1">
                  Carga Aguda (7d)
                </p>
              </div>

              <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4 text-center">
                <p className="text-text-muted font-mono text-[9px] sm:text-xs mb-1">
                  FORMA (TSB)
                </p>
                <p className={`font-mono text-xl sm:text-3xl font-bold ${currentStats.TSB >= 0 ? 'text-accent-lime' : 'text-accent-pink'}`}>
                  {currentStats.TSB}
                </p>
                <p className={`font-mono text-[9px] sm:text-[10px] mt-1 font-bold ${tsbInfo.color}`}>
                  {tsbInfo.status}
                </p>
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-[#151A23] border border-border-primary rounded-lg p-3 sm:p-4 flex gap-3 items-start">
              <div className="p-2 bg-panel-bg rounded border border-border-primary mt-0.5">
                <Sparkles size={16} className="text-accent-lime animate-pulse-neon" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-text-primary font-bold mb-0.5">
                  Estado de Forma Física Actual
                </p>
                <p className="text-xs text-text-secondary">
                  {tsbInfo.desc}. Tu saldo neto es de <strong className={tsbInfo.color}>{currentStats.TSB} puntos</strong>. 
                  {currentStats.TSB < -30 && ' Cuidado: riesgo elevado de sobreentrenamiento. Prioriza descanso.'}
                  {currentStats.TSB >= -30 && currentStats.TSB < -10 && ' Estás en la zona ideal de ganancia cardiovascular.'}
                  {currentStats.TSB >= -10 && currentStats.TSB <= 5 && ' Buen momento para asimilar cargas previas.'}
                  {currentStats.TSB > 5 && ' Listo para rendir al máximo en un test o carrera.'}
                </p>
              </div>
            </div>

            {/* Recharts chart */}
            <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-mono text-xs font-bold text-text-primary">
                  GRÁFICO DE RENDIMIENTO HISTÓRICO
                </h4>
                {/* Time range selector */}
                <div className="flex gap-1 bg-[#151A23] border border-border-primary p-0.5 rounded">
                  {[30, 90, 180].map(days => (
                    <button
                      key={days}
                      onClick={() => setTimeRange(days)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all ${
                        timeRange === days
                          ? 'bg-accent-cyan text-app-bg font-bold'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={filteredData}
                    margin={{ top: 10, right: 5, bottom: 5, left: -25 }}
                  >
                    <defs>
                      <linearGradient id="colorCTL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorATL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-pink)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--accent-pink)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis
                      dataKey="dateStr"
                      stroke="rgba(255,255,255,0.2)"
                      tick={{ fill: '#8B92A5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                      dy={5}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.2)"
                      tick={{ fill: '#8B92A5', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                      tickLine={false}
                      dx={-5}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area
                      name="Fitness (CTL)"
                      type="monotone"
                      dataKey="CTL"
                      stroke="var(--accent-cyan)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCTL)"
                    />
                    <Area
                      name="Fatiga (ATL)"
                      type="monotone"
                      dataKey="ATL"
                      stroke="var(--accent-pink)"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorATL)"
                    />
                    <Line
                      name="Forma (TSB)"
                      type="monotone"
                      dataKey="TSB"
                      stroke="var(--accent-lime)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-border-secondary text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-accent-cyan" />
                  <span className="text-text-secondary">Fitness (CTL)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-accent-pink border-dashed border-t border-accent-pink" />
                  <span className="text-text-secondary">Fatiga (ATL)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-accent-lime" />
                  <span className="text-text-secondary">Forma (TSB)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ACWR content */}
            <div className="bg-panel-bg border border-border-primary rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary font-mono text-xs sm:text-sm mb-1 uppercase">
                    NIVEL DE RIESGO DE FATIGA (ÚLTIMOS 28 DÍAS)
                  </p>
                  <div className="flex items-center gap-2">
                    <FatigueIcon size={20} className={fatigueLevel.color} />
                    <p className={`text-2xl sm:text-3xl font-mono font-bold ${fatigueLevel.color}`}>
                      {fatigueLevel.level}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-text-secondary font-mono text-xs sm:text-sm mb-1 uppercase">
                    RATIO ACWR ACTIVO (ÚLTIMOS 28 DÍAS)
                  </p>
                  <p className="text-2xl sm:text-3xl font-mono font-bold text-text-primary">
                    {acwr.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
                <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1 uppercase">
                  CARGA DE 7 DÍAS
                </p>
                <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
                  {Math.round(recentLoad)}
                </p>
                <p className={`font-mono text-[10px] ${recentLoad > previousLoad ? 'text-accent-lime' : 'text-accent-pink'}`}>
                  {recentLoad > previousLoad ? '↑' : '↓'} {Math.round(Math.abs(recentLoad - previousLoad))} vs 7d anteriores
                </p>
              </div>

              <div className="bg-panel-bg border border-border-primary rounded-lg p-3 sm:p-4">
                <p className="text-text-secondary font-mono text-[10px] sm:text-xs mb-1 uppercase">
                  DISTANCIA 7 DÍAS
                </p>
                <p className="font-mono text-base sm:text-lg text-text-primary font-bold">
                  {formatDistance(recentActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0) * 1000)}
                </p>
                <p className="text-text-secondary font-mono text-[10px]">km totales</p>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
              <p className="font-mono text-xs sm:text-sm text-text-primary leading-relaxed">
                {getRecommendation()}
              </p>
            </div>

            {/* ACWR guide info */}
            <div className="space-y-2 pt-2">
              <p className="text-text-secondary font-mono text-[10px] sm:text-xs">
                GUÍA DE RATIOS DE TRABAJO AGUDO/CRÓNICO (ACWR):
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-cyan rounded" />
                  <span className="text-text-secondary">&lt; 0.8: Zona Subentrenamiento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-lime rounded" />
                  <span className="text-text-secondary">0.8 - 1.3: Zona Óptima (Sin Riesgo)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-gold rounded" />
                  <span className="text-text-secondary">1.3 - 1.5: Zona de Fatiga Moderada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-pink rounded" />
                  <span className="text-text-secondary">&gt; 1.5: Zona de Peligro (Lesiones)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
