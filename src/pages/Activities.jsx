import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useActivitiesContext } from '../contexts/ActivitiesContext';
import { activitiesService } from '../services/activities.service';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { ExportButton } from '../components/ui/ExportButton';
import { formatDistance, formatTime, formatDate, formatActivityType } from '../utils/formatters';
import toast from 'react-hot-toast';

const ACTIVITY_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'RUN', label: 'Running' },
  { value: 'RIDE', label: 'Ciclismo' },
  { value: 'SWIM', label: 'Natación' },
  { value: 'TRAIL_RUN', label: 'Trail Running' },
  { value: 'VIRTUAL_RUN', label: 'Virtual Run' },
  { value: 'VIRTUAL_RIDE', label: 'Virtual Ride' },
  { value: 'HIKE', label: 'Senderismo' },
  { value: 'WALK', label: 'Caminata' },
  { value: 'OTHER', label: 'Otro' },
];

export const Activities = () => {
  const { activities = [], loading, fetchActivities, refetch } = useActivitiesContext();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stravaUrl, setStravaUrl] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    fetchActivities(1, 20);
  }, [fetchActivities]);

  const safeActivities = Array.isArray(activities) ? activities : [];

  const filteredActivities = safeActivities.filter((activity) => {
    const matchesType = !filters.type || activity.type === filters.type;
    const matchesSearch = !filters.search || 
      (activity.name || '').toLowerCase().includes(filters.search.toLowerCase());
    const matchesDateFrom = !filters.dateFrom || 
      new Date(activity.startDate) >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || 
      new Date(activity.startDate) <= new Date(filters.dateTo);
    
    return matchesType && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await activitiesService.uploadFile(file);
      toast.success('Actividad subida exitosamente');
      setUploadModalOpen(false);
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleImportStrava = async () => {
    if (!stravaUrl) return;

    setUploading(true);
    try {
      await activitiesService.importFromStrava(stravaUrl);
      toast.success('Actividad importada desde Strava');
      setImportModalOpen(false);
      setStravaUrl('');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al importar desde Strava');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" text="CARGANDO ACTIVIDADES..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-slide-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-mono font-bold neon-text-cyan">
            ACTIVIDADES
          </h1>
          <p className="text-text-secondary font-mono text-xs sm:text-sm mt-1 sm:mt-2">
            GESTIÓN Y ANÁLISIS DE ENTRENAMIENTOS
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={() => setImportModalOpen(true)} variant="secondary" className="w-full sm:w-auto">
            IMPORTAR STRAVA
          </Button>
          <Button onClick={() => setUploadModalOpen(true)} className="w-full sm:w-auto">
            SUBIR ARCHIVO
          </Button>
          <ExportButton activities={safeActivities} label="EXPORTAR" className="w-full sm:w-auto" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-30" />

      {/* Filtros */}
      <GlassCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label-text block mb-2">TIPO</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full bg-panel-bg-solid border border-border-primary px-4 py-3 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg"
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text block mb-2">BUSCAR</label>
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Nombre de actividad..."
            />
          </div>
          <div>
            <label className="label-text block mb-2">DESDE</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full bg-panel-bg-solid border border-border-primary px-4 py-3 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg"
            />
          </div>
          <div>
            <label className="label-text block mb-2">HASTA</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full bg-panel-bg-solid border border-border-primary px-4 py-3 text-text-primary focus:border-accent-cyan focus:outline-none rounded-lg"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setFilters({ type: '', search: '', dateFrom: '', dateTo: '' })}
            className="text-sm"
          >
            LIMPIAR FILTROS
          </Button>
          <span className="text-text-secondary text-sm self-center">
            {filteredActivities.length} de {safeActivities.length} actividades
          </span>
        </div>
      </GlassCard>

      {filteredActivities.length === 0 && safeActivities.length > 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg mb-4">
              NO HAY ACTIVIDADES QUE COINCIDAN CON LOS FILTROS
            </p>
            <Button onClick={() => setFilters({ type: '', search: '', dateFrom: '', dateTo: '' })}>
              LIMPIAR FILTROS
            </Button>
          </div>
        </GlassCard>
      ) : filteredActivities.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12 sm:py-16">
            <p className="text-text-secondary text-lg sm:text-xl mb-4 sm:mb-6">
              NO HAY ACTIVIDADES REGISTRADAS
            </p>
            <p className="text-text-secondary text-xs sm:text-sm mb-6 sm:mb-8">
              Sube un archivo .FIT, .GPX o .TCX para comenzar
            </p>
            <Button onClick={() => setUploadModalOpen(true)} className="w-full sm:w-auto">
              SUBIR PRIMERA ACTIVIDAD
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="relative">
              <Link to={`/activities/${activity.id}`}>
                <div className="glass-panel p-4 hover:border-accent-cyan transition-all cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                        <span className="text-accent-cyan font-semibold text-sm sm:text-lg">
                          {formatActivityType(activity.type)}
                        </span>
                        <span className="text-text-secondary text-xs sm:text-sm">
                          {formatDate(activity.startTime)}
                        </span>
                      </div>
                      <h3 className="text-text-primary font-medium text-base sm:text-xl mb-1 sm:mb-2">
                        {activity.name || 'Sin título'}
                      </h3>
                      {activity.description && (
                        <p className="text-text-secondary text-xs sm:text-sm">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4 sm:gap-8">
                      <div className="text-center">
                        <p className="label-text text-[10px] sm:text-xs mb-1">DISTANCIA</p>
                        <p className="font-mono text-xl sm:text-3xl text-accent-cyan font-bold">
                          {formatDistance(activity.distance)}
                        </p>
                        <p className="text-text-secondary text-[10px] sm:text-xs">KM</p>
                      </div>
                      <div className="text-center">
                        <p className="label-text text-[10px] sm:text-xs mb-1">TIEMPO</p>
                        <p className="font-mono text-xl sm:text-3xl text-accent-lime font-bold">
                          {formatTime(activity.movingTime)}
                        </p>
                        <p className="text-text-secondary text-[10px] sm:text-xs">H:M:S</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="label-text text-xs mb-1">DESNIVEL</p>
                        <p className="font-mono text-3xl text-accent-gold font-bold">
                          {Math.round(activity.totalElevationGain || 0)}
                        </p>
                        <p className="text-text-secondary text-xs">M</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              <Link
                to={`/ai-analysis?activityId=${activity.id}`}
                className="absolute top-2 right-2 sm:top-4 sm:right-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="secondary" size="sm" className="text-xs py-2 px-3">
                  IA
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="SUBIR ARCHIVO"
      >
        <div className="space-y-4">
          <p className="text-text-secondary font-mono text-sm">
            Formatos soportados: .FIT, .GPX, .TCX
          </p>
          <input
            type="file"
            accept=".fit,.gpx,.tcx"
            onChange={handleFileUpload}
            disabled={uploading}
            className="w-full bg-panel-bg border-2 border-border-primary p-4 font-mono text-text-primary file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-accent-pace file:text-app-bg file:font-mono file:font-bold"
          />
          {uploading && (
            <div className="flex items-center justify-center gap-3">
              <Spinner />
              <span className="text-text-secondary font-mono">Subiendo...</span>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="IMPORTAR DESDE STRAVA"
        footer={
          <>
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
              CANCELAR
            </Button>
            <Button onClick={handleImportStrava} loading={uploading}>
              IMPORTAR
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="URL DE STRAVA"
            value={stravaUrl}
            onChange={(e) => setStravaUrl(e.target.value)}
            placeholder="https://www.strava.com/activities/..."
          />
          <p className="text-text-secondary font-mono text-xs">
            Pega el enlace de una actividad pública de Strava
          </p>
        </div>
      </Modal>
    </div>
  );
};
