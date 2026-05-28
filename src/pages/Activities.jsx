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
import { useDropzone } from 'react-dropzone';

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

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['fit', 'gpx', 'tcx'].includes(extension)) {
      toast.error('Formato no soportado. Sube archivos .FIT, .GPX o .TCX');
      return;
    }

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: uploading
  });

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
            <div key={activity.id} className="glass-panel p-4 hover:border-accent-cyan transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Link to={`/activities/${activity.id}`} className="flex-1 min-w-0 block">
                <div>
                  <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                    <span className="text-accent-cyan font-semibold text-sm sm:text-lg">
                      {formatActivityType(activity.type)}
                    </span>
                    <span className="text-text-secondary text-xs sm:text-sm font-mono">
                      {formatDate(activity.startDate)}
                    </span>
                  </div>
                  <h3 className="text-text-primary font-semibold text-base sm:text-xl mb-1 sm:mb-2 hover:text-accent-cyan transition-colors">
                    {activity.name || 'Sin título'}
                  </h3>
                  {activity.description && (
                    <p className="text-text-secondary text-xs sm:text-sm truncate">
                      {activity.description}
                    </p>
                  )}
                </div>
              </Link>

              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                <Link to={`/activities/${activity.id}`} className="flex gap-4 sm:gap-8 items-center">
                  <div className="text-center min-w-[70px]">
                    <p className="label-text text-[10px] sm:text-xs mb-1">DISTANCIA</p>
                    <p className="font-mono text-xl sm:text-3xl text-accent-cyan font-bold">
                      {formatDistance(activity.distanceKm)}
                    </p>
                    <p className="text-text-secondary text-[10px] sm:text-xs">KM</p>
                  </div>
                  <div className="text-center min-w-[70px]">
                    <p className="label-text text-[10px] sm:text-xs mb-1">TIEMPO</p>
                    <p className="font-mono text-xl sm:text-3xl text-accent-lime font-bold">
                      {formatTime(activity.movingTime)}
                    </p>
                    <p className="text-text-secondary text-[10px] sm:text-xs">H:M:S</p>
                  </div>
                  <div className="text-center min-w-[70px] hidden sm:block">
                    <p className="label-text text-xs mb-1">DESNIVEL</p>
                    <p className="font-mono text-3xl text-accent-gold font-bold">
                      {Math.round(activity.elevationM || 0)}
                    </p>
                    <p className="text-text-secondary text-xs">M</p>
                  </div>
                </Link>
                <div className="pl-3 border-l border-border-primary/50 flex items-center h-10">
                  <Link to={`/ai-analysis?activityId=${activity.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs py-2 px-3 whitespace-nowrap">
                      IA
                    </Button>
                  </Link>
                </div>
              </div>
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
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-accent-cyan bg-accent-cyan/10'
                : 'border-border-primary hover:border-accent-cyan bg-panel-bg'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-3">
              <span className="text-3xl text-accent-cyan animate-pulse-neon">
                ☁️
              </span>
              <p className="text-sm font-mono text-text-primary">
                {isDragActive
                  ? 'Suelta el archivo aquí...'
                  : 'Arrastra tu archivo aquí o haz clic para buscar'}
              </p>
              <p className="text-xs font-mono text-text-secondary">
                Formatos soportados: .FIT, .GPX, .TCX (Máx. 15MB)
              </p>
            </div>
          </div>
          {uploading && (
            <div className="flex items-center justify-center gap-3 bg-panel-bg p-3 rounded-lg border border-border-primary">
              <Spinner />
              <span className="text-text-secondary font-mono text-xs">Subiendo y procesando actividad...</span>
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
