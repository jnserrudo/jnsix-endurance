import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { activitiesService } from '../services/activities.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { ExportButton } from '../components/ui/ExportButton';
import { formatDistance, formatTime, formatDate, formatActivityType } from '../utils/formatters';
import toast from 'react-hot-toast';

export const Activities = () => {
  const { activities = [], loading, refetch } = useActivities(1, 20);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stravaUrl, setStravaUrl] = useState('');

  const safeActivities = Array.isArray(activities) ? activities : [];

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
    <div className="space-y-8 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-mono font-bold neon-text-cyan">
            ACTIVIDADES
          </h1>
          <p className="text-text-secondary font-mono text-sm mt-2">
            GESTIÓN Y ANÁLISIS DE ENTRENAMIENTOS
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setImportModalOpen(true)} variant="secondary">
            IMPORTAR STRAVA
          </Button>
          <Button onClick={() => setUploadModalOpen(true)}>
            SUBIR ARCHIVO
          </Button>
          <ExportButton activities={safeActivities} label="EXPORTAR" />
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      {safeActivities.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <p className="text-text-secondary font-mono text-xl mb-6">
              NO HAY ACTIVIDADES REGISTRADAS
            </p>
            <p className="text-text-secondary font-mono text-sm mb-8">
              Sube un archivo .FIT, .GPX o .TCX para comenzar
            </p>
            <Button onClick={() => setUploadModalOpen(true)}>
              SUBIR PRIMERA ACTIVIDAD
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {safeActivities.map((activity) => (
            <Link key={activity.id} to={`/activities/${activity.id}`}>
              <Card className="hover:border-accent-pace transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-accent-pace font-mono font-bold text-lg">
                        {formatActivityType(activity.type)}
                      </span>
                      <span className="text-text-secondary font-mono text-sm">
                        {formatDate(activity.startTime)}
                      </span>
                    </div>
                    <h3 className="text-text-primary font-mono text-xl mb-2">
                      {activity.name || 'Sin título'}
                    </h3>
                    {activity.description && (
                      <p className="text-text-secondary font-mono text-sm">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-8">
                    <div className="text-center">
                      <p className="label-text mb-1">DISTANCIA</p>
                      <p className="stat-number text-3xl neon-text-cyan">
                        {formatDistance(activity.distance)}
                      </p>
                      <p className="text-text-secondary font-mono text-xs">KM</p>
                    </div>
                    <div className="text-center">
                      <p className="label-text mb-1">TIEMPO</p>
                      <p className="stat-number text-3xl neon-text-lime">
                        {formatTime(activity.movingTime)}
                      </p>
                      <p className="text-text-secondary font-mono text-xs">H:M:S</p>
                    </div>
                    <div className="text-center">
                      <p className="label-text mb-1">DESNIVEL</p>
                      <p className="stat-number text-3xl neon-text-gold">
                        {Math.round(activity.totalElevationGain || 0)}
                      </p>
                      <p className="text-text-secondary font-mono text-xs">M</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
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
