import { useState } from 'react';
import { useActivities } from '../hooks/useActivities';
import { aiService } from '../services/ai.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const ANALYSIS_TYPES = [
  { value: 'PERFORMANCE_ANALYSIS', label: 'Análisis de Rendimiento', icon: '◆' },
  { value: 'TRAINING_RECOMMENDATION', label: 'Recomendaciones de Entrenamiento', icon: '▶' },
  { value: 'RACE_STRATEGY', label: 'Estrategia de Carrera', icon: '◉' },
  { value: 'FATIGUE_ANALYSIS', label: 'Análisis de Fatiga', icon: '◭' },
  { value: 'TIME_PREDICTION', label: 'Predicción de Tiempos', icon: '◈' },
  { value: 'GENERAL_INSIGHT', label: 'Insights Generales', icon: '◇' },
];

export const AIAnalysis = () => {
  const { activities, loading: loadingActivities } = useActivities(1, 10);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (!selectedActivity || !selectedType) {
      toast.error('Selecciona una actividad y tipo de análisis');
      return;
    }

    setAnalyzing(true);
    try {
      const data = await aiService.analyzeActivity(selectedActivity, selectedType);
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
        <h1 className="text-4xl font-mono font-bold neon-text-cyan">
          ANÁLISIS CON IA
        </h1>
        <p className="text-text-secondary font-mono text-sm mt-2">
          ANÁLISIS AVANZADO POWERED BY GROQ LLAMA 3 70B
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card neon>
          <h2 className="text-2xl font-mono font-bold text-text-primary mb-6">
            CONFIGURACIÓN
          </h2>

          <div className="space-y-6">
            <div>
              <label className="label-text block mb-3">SELECCIONAR ACTIVIDAD</label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full bg-panel-bg border-2 border-border-primary px-4 py-3 font-mono text-text-primary focus:border-accent-pace focus:outline-none"
                style={{
                  clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)'
                }}
              >
                <option value="">-- Selecciona --</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name || 'Sin título'} - {new Date(activity.startTime).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text block mb-3">TIPO DE ANÁLISIS</label>
              <div className="grid grid-cols-2 gap-3">
                {ANALYSIS_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`p-4 border-2 font-mono text-sm transition-all ${
                      selectedType === type.value
                        ? 'border-accent-pace bg-accent-pace/10 text-accent-pace'
                        : 'border-border-primary text-text-secondary hover:border-accent-pace/50'
                    }`}
                    style={{
                      clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)'
                    }}
                  >
                    <span className="text-2xl block mb-2">{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              loading={analyzing}
              disabled={!selectedActivity || !selectedType}
              className="w-full"
            >
              {analyzing ? 'ANALIZANDO...' : 'INICIAR ANÁLISIS'}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-mono font-bold text-text-primary mb-6">
            RESULTADO
          </h2>

          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Spinner size="lg" />
              <p className="text-text-secondary font-mono animate-pulse-neon">
                PROCESANDO CON IA...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="bg-panel-bg p-4 border-l-4 border-accent-pace">
                <p className="label-text mb-2">MODELO</p>
                <p className="text-text-primary font-mono">{result.model}</p>
              </div>
              <div className="bg-panel-bg p-4 border-l-4 border-accent-lime">
                <p className="label-text mb-2">TOKENS USADOS</p>
                <p className="text-text-primary font-mono">{result.tokensUsed}</p>
              </div>
              <div className="bg-app-bg p-6 border-2 border-accent-pace">
                <p className="label-text mb-4">ANÁLISIS</p>
                <div className="text-text-primary font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {result.response}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <p className="text-text-secondary font-mono text-center">
                Selecciona una actividad y tipo de análisis<br />
                para comenzar
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
