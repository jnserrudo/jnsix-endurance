import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useActivitiesContext } from '../contexts/ActivitiesContext';
import { competitionsService } from '../services/competitions.service';
import { aiService } from '../services/ai.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { formatDistance, formatTime, formatDate, formatActivityType } from '../utils/formatters';
import { Trophy, Calendar, Plus, Target, CheckCircle2, ChevronRight, Activity, Trash2, Fuel, RefreshCw, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Competitions = () => {
  const { activities } = useActivitiesContext();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [analyzingCompId, setAnalyzingCompId] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [selectedComp, setSelectedComp] = useState(null);
  const [showSimulationsModal, setShowSimulationsModal] = useState(false);
  
  // Nutrición Interactiva
  const [targetCarbsPerHour, setTargetCarbsPerHour] = useState(90); // default 90g/hr (científico)
  const [fluidPerHr, setFluidPerHr] = useState(750); // 750ml/hr default
  
  // Campos del Formulario
  const [name, setName] = useState('');
  const [type, setType] = useState('TRAIL_RUN');
  const [distanceKm, setDistanceKm] = useState(21);
  const [elevationM, setElevationM] = useState(1000);
  const [targetDate, setTargetDate] = useState('');
  const [targetTime, setTargetTime] = useState('04:00:00');
  const [terrainType, setTerrainType] = useState('Sendero técnico, piedras y barro');
  const [notes, setNotes] = useState('');

  const fetchCompetitions = async () => {
    try {
      const data = await competitionsService.getCompetitions();
      setCompetitions(data);
      if (data.length > 0 && !selectedComp) {
        setSelectedComp(data[0]);
      }
    } catch (error) {
      toast.error('Error al cargar objetivos de competencia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !targetDate) {
      toast.error('Nombre y fecha son obligatorios');
      return;
    }

    try {
      setLoading(true);
      const newComp = await competitionsService.createCompetition({
        name,
        type,
        distanceKm: Number(distanceKm),
        elevationM: Number(elevationM),
        targetDate,
        targetTime,
        terrainType,
        notes
      });
      toast.success('¡Objetivo de competencia creado exitosamente!');
      setName('');
      setNotes('');
      setShowAddForm(false);
      fetchCompetitions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar competencia');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este objetivo?')) return;
    try {
      setLoading(true);
      await competitionsService.deleteCompetition(id);
      toast.success('Objetivo eliminado');
      setSelectedComp(null);
      setAiReport(null);
      fetchCompetitions();
    } catch (error) {
      toast.error('Error al eliminar');
      setLoading(false);
    }
  };

  const handleAssociateSimulation = async (activityId, isAssociated) => {
    if (!selectedComp) return;
    try {
      const updated = await competitionsService.associateSimulation(
        selectedComp.id,
        activityId,
        isAssociated // true significa eliminar relación
      );
      setSelectedComp(updated);
      setCompetitions(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success(isAssociated ? 'Entrenamiento desvinculado' : '¡Entrenamiento vinculado como simulación!');
    } catch (error) {
      toast.error('Error al actualizar simulación');
    }
  };

  const handleGenerateAIStrategy = async (compId) => {
    setAnalyzingCompId(compId);
    setAiReport(null);
    const loadingToast = toast.loading('JNSIX AI Strategy Coach analizando tu preparación...');
    try {
      const data = await aiService.analyzeCompetitionGoal(compId);
      setAiReport(data.response);
      toast.success('¡Reporte de Estrategia e Inteligencia de Carrera Generado!', { icon: '🏆' });
    } catch (error) {
      toast.error('Error al generar análisis con IA. Asegúrate de tener entrenamientos registrados.');
    } finally {
      toast.dismiss(loadingToast);
      setAnalyzingCompId(null);
    }
  };

  // Cálculo de Nutrición Científica e Hidratación en base al tiempo objetivo
  const calculateNutritionNeeds = () => {
    if (!selectedComp) return null;
    let hours = 4.0;
    if (selectedComp.targetTime) {
      const parts = selectedComp.targetTime.split(':');
      if (parts.length === 3) {
        hours = parseInt(parts[0]) + parseInt(parts[1])/60 + parseInt(parts[2])/3600;
      }
    } else {
      // Estimar 6 min/km por defecto para Trail, 5 para carrera
      const estPace = selectedComp.type === 'TRAIL_RUN' ? 7 : 5.5;
      hours = (selectedComp.distanceKm * estPace) / 60;
    }

    const totalCarbs = Math.round(targetCarbsPerHour * hours);
    const totalFluid = Math.round(fluidPerHr * hours);
    const totalGels = Math.ceil(totalCarbs / 30); // 30g de carbohidratos promedio por gel
    const totalSaltCaps = Math.ceil(hours * 1.5); // 1.5 caps por hora promedio

    // Formato legible de horas: "5h 42min" en vez de "5.7"
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const hoursFormatted = h > 0 ? `${h}h ${m}min` : `${m}min`;

    return {
      hours: hoursFormatted,
      totalCarbs,
      totalFluid: (totalFluid / 1000).toFixed(1),
      totalGels,
      totalSaltCaps
    };
  };

  const nutMetrics = calculateNutritionNeeds();

  if (loading && competitions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" text="CARGANDO OBJETIVOS DE COMPETENCIA..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-mono font-bold neon-text-cyan flex items-center gap-2">
            🏆 COMPETENCIAS Y OBJETIVOS IA
          </h1>
          <p className="text-text-secondary text-sm mt-2 font-mono">
            Planifica tus carreras objetivo, vincula simulaciones y genera estrategias competitivas científicas con Inteligencia Artificial.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
          {showAddForm ? 'VER OBJETIVOS' : <><Plus size={16} /> NUEVA COMPETENCIA</>}
        </Button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      {/* Formulario de Alta */}
      {showAddForm ? (
        <Card neon className="max-w-2xl mx-auto p-6">
          <h3 className="text-lg font-mono font-bold text-text-primary mb-4 uppercase tracking-wider">CREAR NUEVO OBJETIVO DE COMPETENCIA</h3>
          <form onSubmit={handleCreate} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text mb-2 block">NOMBRE DEL EVENTO</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Patagonia Run 42k, Ironman 70.3"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-app-bg border-2 border-border-primary px-3 py-2 rounded focus:border-accent-cyan focus:outline-none text-text-primary"
                />
              </div>
              <div>
                <label className="label-text mb-2 block">DISCIPLINA</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-app-bg border-2 border-border-primary px-3 py-2 rounded focus:border-accent-cyan focus:outline-none text-text-primary"
                >
                  <option value="TRAIL_RUN">Trail Running</option>
                  <option value="RUN">Carrera en Ruta / Asfalto</option>
                  <option value="RIDE">Ciclismo</option>
                  <option value="SWIM">Natación</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-text mb-2 block">DISTANCIA (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full bg-app-bg border-2 border-border-primary px-3 py-2 rounded focus:border-accent-cyan focus:outline-none text-text-primary font-mono"
                />
              </div>
              <div>
                <label className="label-text mb-2 block">DESNIVEL ACUMULADO (+ METROS)</label>
                <input
                  type="number"
                  value={elevationM}
                  onChange={(e) => setElevationM(e.target.value)}
                  className="w-full bg-app-bg border-2 border-border-primary px-3 py-2 rounded focus:border-accent-cyan focus:outline-none text-text-primary font-mono"
                />
              </div>
              <div>
                <label className="label-text mb-2 block">TIEMPO ESTIMADO/OBJETIVO</label>
                <input
                  type="text"
                  placeholder="HH:MM:SS (ej: 04:30:00)"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full bg-app-bg border-2 border-border-primary px-3 py-2 rounded focus:border-accent-cyan focus:outline-none text-text-primary font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text mb-2 block">FECHA DE COMPETENCIA</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-app-bg border-2 border-border-primary px-3 py-2 rounded focus:border-accent-cyan focus:outline-none text-text-primary font-mono"
                />
              </div>
              <div>
                <label className="label-text mb-2 block">TIPO DE TERRENO / CLIMA</label>
                <input
                  type="text"
                  placeholder="Ej: Montaña técnica, arena, lluvia"
                  value={terrainType}
                  onChange={(e) => setTerrainType(e.target.value)}
                  className="w-full bg-app-bg border-2 border-border-primary px-3 py-2 rounded focus:border-accent-cyan focus:outline-none text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="label-text mb-2 block">NOTAS / ESTRATEGIA INICIAL</label>
              <textarea
                rows="3"
                placeholder="Ingresa notas sobre puestos de abastecimiento, subidas duras o calzado..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-app-bg border-2 border-border-primary px-3 py-2 rounded focus:border-accent-cyan focus:outline-none text-text-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>CANCELAR</Button>
              <Button type="submit">GUARDAR OBJETIVO</Button>
            </div>
          </form>
        </Card>
      ) : competitions.length === 0 ? (
        <Card className="text-center py-12">
          <Trophy size={48} className="text-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-mono font-bold text-text-primary mb-2">SIN OBJETIVOS REGISTRADOS</h3>
          <p className="text-text-secondary font-mono text-sm max-w-md mx-auto mb-6">
            Aún no has definido ninguna competencia. Registra tu próximo gran evento para que la IA arme tu estrategia nutricional y de ritmo.
          </p>
          <Button onClick={() => setShowAddForm(true)}>REGISTRAR MI PRIMERA COMPETENCIA</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Listado de competencias */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider mb-2">MIS OBJETIVOS ACTIVOS</h3>
            {competitions.map((comp) => {
              const daysLeft = Math.ceil((new Date(comp.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
              const isSelected = selectedComp?.id === comp.id;
              
              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    setSelectedComp(comp);
                    setAiReport(null);
                  }}
                  className={`glass-panel p-4 cursor-pointer border transition-all ${
                    isSelected ? 'border-accent-cyan bg-accent-cyan/5 shadow-[0_0_15px_rgba(0,212,255,0.1)]' : 'border-border-primary hover:border-text-secondary'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded uppercase">
                      {formatActivityType(comp.type)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(comp.id);
                      }}
                      className="text-text-secondary hover:text-accent-pink p-1 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <h4 className="font-mono font-bold text-text-primary text-sm sm:text-base mb-2 truncate">
                    {comp.name}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-secondary mb-3">
                    <div>
                      <span className="block text-text-muted">DISTANCIA</span>
                      <span className="font-bold text-text-primary">{comp.distanceKm} km</span>
                    </div>
                    <div>
                      <span className="block text-text-muted">DESNIVEL</span>
                      <span className="font-bold text-text-primary">+{comp.elevationM} m</span>
                    </div>
                  </div>

                  <div className="border-t border-border-primary/50 pt-3 flex items-center justify-between text-xs font-mono">
                    <span className="text-text-secondary flex items-center gap-1">
                      <Calendar size={12} /> {formatDate(comp.targetDate)}
                    </span>
                    <span className={`font-bold ${daysLeft > 14 ? 'text-accent-lime' : daysLeft > 0 ? 'text-accent-gold' : 'text-text-muted'}`}>
                      {daysLeft > 0 ? `Faltan ${daysLeft} días` : 'Realizado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Columna Derecha: Detalle, Simulador y Consultas IA */}
          <div className="lg:col-span-8 space-y-6">
            {selectedComp && (
              <div className="space-y-6">
                {/* Detalles de la Carrera Seleccionada */}
                <Card neon className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-primary pb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-mono font-bold text-text-primary">
                        {selectedComp.name}
                      </h2>
                      <p className="text-xs text-text-secondary font-mono mt-1">
                        Objetivo registrado el {formatDate(selectedComp.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleGenerateAIStrategy(selectedComp.id)}
                        loading={analyzingCompId === selectedComp.id}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw size={14} className={analyzingCompId === selectedComp.id ? 'animate-spin' : ''} />
                        ANALIZAR PREPARACIÓN CON IA
                      </Button>
                    </div>
                  </div>

                  {/* Ficha Técnica */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                    <div className="bg-panel-bg p-3 border border-border-primary text-center">
                      <span className="block text-[10px] text-text-secondary mb-1">DISTANCIA OBJETIVO</span>
                      <span className="text-lg font-bold text-accent-cyan">{selectedComp.distanceKm} km</span>
                    </div>
                    <div className="bg-panel-bg p-3 border border-border-primary text-center">
                      <span className="block text-[10px] text-text-secondary mb-1">DESNIVEL ACUMULADO</span>
                      <span className="text-lg font-bold text-accent-gold">+{selectedComp.elevationM} m</span>
                    </div>
                    <div className="bg-panel-bg p-3 border border-border-primary text-center">
                      <span className="block text-[10px] text-text-secondary mb-1">TIEMPO OBJETIVO</span>
                      <span className="text-lg font-bold text-accent-lime">{selectedComp.targetTime || 'N/A'}</span>
                    </div>
                    <div className="bg-panel-bg p-3 border border-border-primary text-center">
                      <span className="block text-[10px] text-text-secondary mb-1">TERRENO</span>
                      <span className="text-xs font-bold text-text-primary truncate block" title={selectedComp.terrainType}>
                        {selectedComp.terrainType || 'No especificado'}
                      </span>
                    </div>
                  </div>

                  {/* Notas */}
                  {selectedComp.notes && (
                    <div className="bg-panel-bg p-4 rounded border border-border-primary font-mono text-xs">
                      <span className="block text-text-muted mb-1 font-bold">NOTAS Y CONFIGURACIÓN INICIAL:</span>
                      <p className="text-text-secondary leading-relaxed">{selectedComp.notes}</p>
                    </div>
                  )}
                </Card>

                {/* Simulador de Carrera (Entrenamientos clave asociados) */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border-primary pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="text-accent-pink" size={18} />
                      <h3 className="font-mono font-bold text-text-primary text-sm uppercase">
                        Entrenamientos de Simulación de Carrera ({selectedComp.simulations?.length || 0})
                      </h3>
                    </div>
                    <Button variant="glass" size="xs" onClick={() => setShowSimulationsModal(true)}>
                      VINCULAR ENTRENAMIENTO
                    </Button>
                  </div>
                  
                  <p className="text-xs text-text-secondary font-mono leading-relaxed">
                    Vincular simulaciones (fondos largos con desnivel, carreras previas o pasadas de ritmo) permite que JNSIX AI Coach evalúe de forma extremadamente precisa tu ritmo específico, consumo de energía y confianza competitiva.
                  </p>

                  {selectedComp.simulations && selectedComp.simulations.length > 0 ? (
                    <div className="space-y-3 font-mono text-xs">
                      {selectedComp.simulations.map((sim, idx) => (
                        <div key={sim.id} className="flex items-center justify-between bg-panel-bg p-3 border border-border-primary rounded hover:border-accent-pink transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-accent-pink font-bold">#{idx + 1}</span>
                            <div>
                              <p className="font-bold text-text-primary text-sm">{sim.name}</p>
                              <p className="text-text-secondary text-[10px]">
                                {formatDate(sim.startDate)} • {formatDistance(sim.distanceKm * 1000)} km • +{Math.round(sim.elevationM)}m • {formatTime(sim.movingTime)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAssociateSimulation(sim.id, true)}
                            className="text-text-secondary hover:text-accent-pink font-bold text-[10px] uppercase border border-border-primary hover:border-accent-pink px-2 py-1 transition-all rounded"
                          >
                            DESVINCULAR
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-panel-bg-solid border border-border-primary rounded font-mono text-xs text-text-secondary">
                      No has vinculado ningún entrenamiento específico de simulación. ¡Presiona el botón de arriba para comenzar a modelar!
                    </div>
                  )}
                </Card>

                {/* Calculadora Científica Interactiva de Nutrición e Hidratación */}
                {nutMetrics && (
                  <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-border-primary pb-3">
                      <Fuel className="text-accent-lime" size={18} />
                      <h3 className="font-mono font-bold text-text-primary text-sm uppercase">
                        Calculadora Interactiva de Nutrición e Hidratación IA
                      </h3>
                    </div>

                    <p className="text-xs text-text-secondary font-mono leading-relaxed">
                      Ajusta tus parámetros de carrera para modelar los requisitos exactos de carbohidratos, líquidos y geles que necesitas portar en tu mochila de hidratación.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                      {/* Carbs Selector */}
                      <div className="bg-panel-bg p-3 border border-border-primary rounded space-y-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-text-secondary">CARBOHIDRATOS / HORA</span>
                          <span className="text-accent-cyan">{targetCarbsPerHour} g/hr</span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="120"
                          step="10"
                          value={targetCarbsPerHour}
                          onChange={(e) => setTargetCarbsPerHour(Number(e.target.value))}
                          className="w-full h-1.5 bg-border-primary rounded-lg appearance-none cursor-pointer accent-accent-cyan focus:outline-none"
                        />
                        <div className="flex justify-between text-[8px] text-text-muted">
                          <span>40g (Base)</span>
                          <span>90g (Científico)</span>
                          <span>120g (Elite/Ultra)</span>
                        </div>
                      </div>

                      {/* Fluid Selector */}
                      <div className="bg-panel-bg p-3 border border-border-primary rounded space-y-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-text-secondary">TASA DE SUDOR (FLUIDOS)</span>
                          <span className="text-accent-lime">{fluidPerHr} ml/hr</span>
                        </div>
                        <input
                          type="range"
                          min="400"
                          max="1200"
                          step="50"
                          value={fluidPerHr}
                          onChange={(e) => setFluidPerHr(Number(e.target.value))}
                          className="w-full h-1.5 bg-border-primary rounded-lg appearance-none cursor-pointer accent-accent-lime focus:outline-none"
                        />
                        <div className="flex justify-between text-[8px] text-text-muted">
                          <span>400ml (Baja)</span>
                          <span>800ml (Media)</span>
                          <span>1200ml (Alta)</span>
                        </div>
                      </div>
                    </div>

                    {/* Resultados de Nutrición */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                      <div className="bg-panel-bg-solid p-3 border border-border-primary rounded text-center">
                        <span className="block text-[8px] text-text-secondary mb-1">TIEMPO ESTIMADO</span>
                        <span className="text-base font-bold text-text-primary">{nutMetrics.hours}</span>
                      </div>
                      <div className="bg-panel-bg-solid p-3 border border-border-primary rounded text-center">
                        <span className="block text-[8px] text-text-secondary mb-1">TOTAL CARBOHIDRATOS</span>
                        <span className="text-base font-bold text-accent-cyan">{nutMetrics.totalCarbs} g</span>
                      </div>
                      <div className="bg-panel-bg-solid p-3 border border-border-primary rounded text-center">
                        <span className="block text-[8px] text-text-secondary mb-1">AGUA / FLUIDOS</span>
                        <span className="text-base font-bold text-accent-lime">{nutMetrics.totalFluid} L</span>
                      </div>
                      <div className="bg-panel-bg-solid p-3 border border-border-primary rounded text-center">
                        <span className="block text-[8px] text-text-secondary mb-1">GELES EQUIVALENTES</span>
                        <span className="text-base font-bold text-accent-pink">{nutMetrics.totalGels} geles</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Reporte Generado por IA */}
                {aiReport && (
                  <Card neon className="p-6 space-y-4 border-2 border-accent-cyan/30">
                    <div className="flex items-center justify-between border-b border-border-primary pb-3">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="text-accent-cyan" size={18} />
                        <h3 className="font-mono font-bold text-text-primary text-sm uppercase">
                          REPORTE ESTRATÉGICO JNSIX AI strategy coach
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-text-secondary uppercase">Generado hoy</span>
                    </div>

                    <div className="prose prose-invert max-w-none font-mono text-xs leading-relaxed text-text-secondary overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold text-accent-cyan mt-6 mb-2 uppercase border-b border-border-primary/50 pb-1" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold text-accent-cyan mt-6 mb-2 uppercase border-b border-border-primary/50 pb-1" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold text-accent-cyan mt-6 mb-2 uppercase border-b border-border-primary/50 pb-1" {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-sm font-bold text-accent-cyan mt-6 mb-2 uppercase border-b border-border-primary/50 pb-1" {...props} />,
                          p: ({node, ...props}) => <p className="mb-4" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-4" {...props} />,
                          li: ({node, ...props}) => <li className="text-text-primary" {...props} />,
                        }}
                      >
                        {aiReport}
                      </ReactMarkdown>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Simulación de Carrera (Vincular actividad) */}
      {showSimulationsModal && selectedComp && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-app-bg border border-border-primary w-full max-w-lg p-6 rounded-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-primary pb-2 font-mono">
              <h3 className="text-sm font-bold text-text-primary uppercase">VINCULAR SIMULACIÓN A LA CARRERA</h3>
              <button onClick={() => setShowSimulationsModal(false)} className="text-text-secondary hover:text-text-primary text-lg">×</button>
            </div>
            
            <p className="text-xs text-text-secondary font-mono leading-relaxed">
              Selecciona uno o más entrenamientos específicos de tu historial que sirvan como simulación para la carrera de **{selectedComp.name}**.
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {activities
                .filter(act => act.type === selectedComp.type || (selectedComp.type === 'TRAIL_RUN' && act.type === 'RUN'))
                .map((act) => {
                  const isAssociated = selectedComp.simulations?.some(s => s.id === act.id);
                  return (
                    <div key={act.id} className="bg-panel-bg p-3 border border-border-primary rounded flex justify-between items-center font-mono text-xs">
                      <div>
                        <p className="font-bold text-text-primary truncate max-w-[260px]">{act.name}</p>
                        <p className="text-text-secondary text-[10px]">
                          {formatDate(act.startDate)} • {formatDistance(act.distanceKm * 1000)} km • +{Math.round(act.elevationM || 0)}m
                        </p>
                      </div>
                      <Button
                        variant={isAssociated ? 'secondary' : 'default'}
                        size="xs"
                        onClick={() => handleAssociateSimulation(act.id, isAssociated)}
                      >
                        {isAssociated ? 'DESVINCULAR' : 'VINCULAR'}
                      </Button>
                    </div>
                  );
                })}
              {activities.length === 0 && (
                <p className="text-center font-mono text-xs text-text-secondary py-6">
                  No hay actividades registradas compatibles con la disciplina de la carrera.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowSimulationsModal(false)}>CERRAR</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Competitions;
