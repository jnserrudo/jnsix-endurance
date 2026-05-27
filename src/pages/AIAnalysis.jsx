import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActivitiesContext } from '../contexts/ActivitiesContext';
import { aiService } from '../services/ai.service';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { AnalysisResult } from '../components/ai/AnalysisResult';
import toast from 'react-hot-toast';
import { formatDate, formatDistance } from '../utils/formatters';

const ANALYSIS_TYPES = [
  { value: 'PERFORMANCE_ANALYSIS', label: 'Análisis de Rendimiento', icon: '◆' },
  { value: 'TRAINING_RECOMMENDATION', label: 'Recomendaciones de Entrenamiento', icon: '▶' },
  { value: 'RACE_STRATEGY', label: 'Estrategia de Carrera', icon: '◉' },
  { value: 'FATIGUE_ANALYSIS', label: 'Análisis de Fatiga', icon: '◭' },
  { value: 'TIME_PREDICTION', label: 'Predicción de Tiempos', icon: '◈' },
  { value: 'GENERAL_INSIGHT', label: 'Insights Generales', icon: '◇' },
];

const ANALYSIS_MODES = [
  { value: 'single', label: 'Actividad Individual', icon: '◆' },
  { value: 'multiple', label: 'Múltiples Actividades', icon: '▶' },
  { value: 'compare', label: 'Comparar Actividades', icon: '◉' },
  { value: 'trends', label: 'Análisis de Tendencias', icon: '◭' },
];

// Traducción de tipos de actividad
const translateActivityType = (type) => {
  const translations = {
    'RUN': 'Running',
    'RIDE': 'Ciclismo',
    'SWIM': 'Natación',
    'TRAIL_RUN': 'Trail Running',
    'VIRTUAL_RUN': 'Running Virtual',
    'VIRTUAL_RIDE': 'Ciclismo Virtual',
    'OTHER': 'Otro',
    'WEIGHT_TRAINING': 'Entrenamiento de Fuerza',
    'WORKOUT': 'Entrenamiento',
    'HIKING': 'Senderismo',
    'WALK': 'Caminata',
    'ALPINE_SKI': 'Esquí Alpino',
    'BACKCOUNTRY_SKI': 'Esquí Nieve Polvo',
    'NORDIC_SKI': 'Esquí Nórdico',
    'SNOWSHOE': 'Raquetas de Nieve',
    'KAYAKING': 'Kayak',
    'ROWING': 'Remo',
    'CANOEING': 'Piragüismo',
    'SURFING': 'Surf',
    'STAND_UP_PADDLEBOARDING': 'Paddle Surf',
    'GOLF': 'Golf',
    'TENNIS': 'Tenis',
    'SKATEBOARDING': 'Skate',
    'EBIKE_RIDE': 'Bicicleta Eléctrica',
    'EMOUNTAIN_BIKE': 'MTB Eléctrica'
  };
  return translations[type] || type;
};

// Formatear distancia según tipo de actividad
const formatDistanceByType = (distanceKm, type) => {
  if (!distanceKm) return '0 km';
  
  // Natación y actividades acuáticas en metros
  const waterActivities = ['SWIM', 'KAYAKING', 'ROWING', 'CANOEING', 'SURFING', 'STAND_UP_PADDLEBOARDING'];
  if (waterActivities.includes(type)) {
    return `${(distanceKm * 1000).toFixed(0)} m`;
  }
  
  // Resto en km
  return `${formatDistance(distanceKm)} km`;
};

// Obtener datos relevantes según tipo de actividad
const getActivityDisplayData = (activity) => {
  const type = activity.type;
  const distance = formatDistanceByType(activity.distanceKm, type);
  const time = Math.floor(activity.movingTime / 60);
  
  // Truncar nombre si es muy largo
  const name = activity.name || 'Sin título';
  const truncatedName = name.length > 25 ? name.substring(0, 25) + '...' : name;
  
  // Formato: Nombre | Tipo | Distancia/Tiempo | Fecha
  let displayData = truncatedName;
  displayData += ` | ${translateActivityType(type)}`;
  
  if (activity.distanceKm && activity.distanceKm > 0) {
    displayData += ` | ${distance}`;
  } else {
    displayData += ` | ${time} min`;
  }
  
  // Fecha en formato DD/MM/YYYY
  const date = new Date(activity.startDate);
  const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  displayData += ` | ${dateStr}`;
  
  return displayData;
};

export const AIAnalysis = () => {
  const { activities, loading: loadingActivities, fetchActivities } = useActivitiesContext();
  const [searchParams] = useSearchParams();
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [analysisMode, setAnalysisMode] = useState('single');
  const [trendDays, setTrendDays] = useState(30);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  
  // Filtros adicionales
  const [filterType, setFilterType] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMinDistance, setFilterMinDistance] = useState('');
  const [filterMaxDistance, setFilterMaxDistance] = useState('');

  useEffect(() => {
    const activityIdFromUrl = searchParams.get('activityId');
    if (activityIdFromUrl) {
      setSelectedActivity(activityIdFromUrl);
      setAnalysisMode('single');
    }
  }, [searchParams]);

  useEffect(() => {
    // Solo fetch si no hay actividades cargadas
    if (activities.length === 0 && !loadingActivities) {
      fetchActivities(1, 50);
    }
  }, [activities.length, loadingActivities, fetchActivities]);

  // Filtrar actividades según los filtros seleccionados
  const filteredActivities = activities.filter(activity => {
    if (filterType && activity.type !== filterType) return false;
    if (filterDateFrom && new Date(activity.startDate) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(activity.startDate) > new Date(filterDateTo)) return false;
    if (filterMinDistance && (activity.distanceKm || 0) < parseFloat(filterMinDistance)) return false;
    if (filterMaxDistance && (activity.distanceKm || 0) > parseFloat(filterMaxDistance)) return false;
    return true;
  });

  const handleActivityToggle = (activityId) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleAnalyze = async () => {
    if (analysisMode === 'single' && (!selectedActivity || !selectedType)) {
      toast.error('Selecciona una actividad y tipo de análisis');
      return;
    }

    if (analysisMode === 'multiple' && selectedActivities.length === 0) {
      toast.error('Selecciona al menos una actividad');
      return;
    }

    if (analysisMode === 'compare' && selectedActivities.length < 2) {
      toast.error('Selecciona al menos 2 actividades para comparar');
      return;
    }

    setAnalyzing(true);
    try {
      let data;
      if (analysisMode === 'single') {
        data = await aiService.analyzeActivity(selectedActivity, selectedType);
      } else if (analysisMode === 'multiple') {
        data = await aiService.analyzeMultipleActivities(selectedActivities, selectedType || 'PERFORMANCE_ANALYSIS');
      } else if (analysisMode === 'compare') {
        data = await aiService.compareActivities(selectedActivities);
      } else if (analysisMode === 'trends') {
        data = await aiService.analyzeTrends(trendDays);
      }
      setResult(data);
      toast.success('Análisis completado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al analizar');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loadingActivities) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">
          ANÁLISIS CON IA
        </h1>
        <p className="text-text-secondary text-xs sm:text-sm mt-2 font-medium">
          ANÁLISIS AVANZADO POWERED BY GROQ LLAMA 3 70B
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-30" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <GlassCard>
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            CONFIGURACIÓN
          </h2>

          <div className="space-y-6">
            {/* Filtros */}
            <div className="glass-panel p-3 sm:p-4 rounded-lg">
              <p className="label-text mb-3 text-xs sm:text-sm">FILTROS DE ACTIVIDADES</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">TIPO</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-panel-bg-solid border border-border-primary px-2 sm:px-3 py-2 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg text-xs sm:text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="RUN">Running</option>
                    <option value="RIDE">Ciclismo</option>
                    <option value="SWIM">Natación</option>
                    <option value="TRAIL_RUN">Trail Running</option>
                    <option value="VIRTUAL_RUN">Running Virtual</option>
                    <option value="VIRTUAL_RIDE">Ciclismo Virtual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">DESDE</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full bg-panel-bg-solid border border-border-primary px-2 sm:px-3 py-2 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">HASTA</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full bg-panel-bg-solid border border-border-primary px-2 sm:px-3 py-2 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">DISTANCIA MÍN (KM)</label>
                  <input
                    type="number"
                    value={filterMinDistance}
                    onChange={(e) => setFilterMinDistance(e.target.value)}
                    placeholder="0"
                    className="w-full bg-panel-bg-solid border border-border-primary px-2 sm:px-3 py-2 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg text-xs sm:text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterMinDistance('');
                  setFilterMaxDistance('');
                }}
                className="mt-2 sm:mt-3 text-xs text-accent-cyan hover:text-accent-lime transition-colors"
              >
                Limpiar filtros
              </button>
              <p className="text-xs text-text-secondary mt-1 sm:mt-2">
                {filteredActivities.length} de {activities.length} actividades
              </p>
            </div>

            <div>
              <label className="label-text block mb-3">MODO DE ANÁLISIS</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ANALYSIS_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => {
                      setAnalysisMode(mode.value);
                      setSelectedActivities([]);
                      setSelectedActivity('');
                    }}
                    className={`p-4 border rounded-lg text-sm transition-all ${
                      analysisMode === mode.value
                        ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                        : 'border-border-primary text-text-secondary hover:border-accent-cyan/50'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{mode.icon}</span>
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {analysisMode === 'single' && (
              <>
                <div>
                  <label className="label-text block mb-3">SELECCIONAR ACTIVIDAD</label>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full bg-panel-bg-solid border border-border-primary px-3 sm:px-4 py-2 sm:py-3 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg text-xs sm:text-sm"
                  >
                    <option value="">-- Selecciona --</option>
                    {filteredActivities.map((activity) => (
                      <option key={activity.id} value={activity.id} className="text-xs">
                        {getActivityDisplayData(activity)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-text block mb-3">TIPO DE ANÁLISIS</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ANALYSIS_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`p-4 border rounded-lg text-sm transition-all ${
                          selectedType === type.value
                            ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                            : 'border-border-primary text-text-secondary hover:border-accent-cyan/50'
                        }`}
                      >
                        <span className="text-2xl block mb-2">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(analysisMode === 'multiple' || analysisMode === 'compare') && (
              <div>
                <label className="label-text block mb-3">
                  {analysisMode === 'compare' ? 'SELECCIONAR ACTIVIDADES A COMPARAR (mínimo 2)' : 'SELECCIONAR ACTIVIDADES'}
                </label>
                <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2">
                  {filteredActivities.map((activity) => (
                    <label
                      key={activity.id}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedActivities.includes(activity.id)
                          ? 'border-accent-cyan bg-accent-cyan/10'
                          : 'border-border-primary hover:border-accent-cyan/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedActivities.includes(activity.id)}
                        onChange={() => handleActivityToggle(activity.id)}
                        className="w-4 h-4 sm:w-5 sm:h-5 accent-accent-cyan"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-xs sm:text-sm truncate">
                          {activity.name || 'Sin título'}
                        </p>
                        <p className="text-text-secondary text-xs truncate">
                          {getActivityDisplayData(activity)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-text-secondary text-xs mt-1 sm:mt-2">
                  {selectedActivities.length} actividades seleccionadas
                </p>
              </div>
            )}

            {analysisMode === 'trends' && (
              <div>
                <label className="label-text block mb-3">PERÍODO DE ANÁLISIS</label>
                <select
                  value={trendDays}
                  onChange={(e) => setTrendDays(parseInt(e.target.value))}
                  className="w-full bg-panel-bg-solid border border-border-primary px-3 sm:px-4 py-2 sm:py-3 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg text-xs sm:text-sm"
                >
                  <option value="7">Últimos 7 días</option>
                  <option value="14">Últimos 14 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="60">Últimos 60 días</option>
                  <option value="90">Últimos 90 días</option>
                </select>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={
                (analysisMode === 'single' && (!selectedActivity || !selectedType)) ||
                (analysisMode === 'multiple' && selectedActivities.length === 0) ||
                (analysisMode === 'compare' && selectedActivities.length < 2)
              }
              className="w-full"
            >
              {analyzing ? 'ANALIZANDO...' : 'INICIAR ANÁLISIS'}
            </Button>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4 sm:mb-6">
            RESULTADO
          </h2>

          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-3 sm:space-y-4">
              <Spinner size="lg" />
              <p className="text-text-secondary text-xs sm:text-sm animate-pulse">
                PROCESANDO CON IA...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="glass-panel p-4 border-l-4 border-accent-cyan rounded-lg">
                <p className="label-text mb-2">MODELO</p>
                <p className="text-text-primary font-mono">{result.model}</p>
              </div>
              <div className="glass-panel p-4 border-l-4 border-accent-lime rounded-lg">
                <p className="label-text mb-2">TOKENS USADOS</p>
                <p className="text-text-primary font-mono">{result.tokensUsed}</p>
              </div>
              <AnalysisResult response={result.response} />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 sm:py-16">
              <p className="text-text-secondary text-center text-xs sm:text-sm">
                Selecciona una actividad y tipo de análisis<br />
                para comenzar
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
