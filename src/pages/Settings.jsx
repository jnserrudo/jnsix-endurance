import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { activitiesService } from '../services/activities.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);

  useEffect(() => {
    // Verificar si hay conexión con Strava
    const isConnected = !!user?.stravaId;
    console.log('[SETTINGS] Usuario:', user);
    console.log('[SETTINGS] Strava conectado:', isConnected);
    setStravaConnected(isConnected);
  }, [user]);

  const handleConnectStrava = async () => {
    console.log('[SETTINGS] Iniciando conexión con Strava...');
    setLoading(true);
    try {
      const data = await authService.connectStrava();
      console.log('[SETTINGS] Datos recibidos:', data);
      console.log('[SETTINGS] Redirigiendo a:', data.authUrl);
      // Redirigir a Strava OAuth
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('🔴 [SETTINGS] Error al conectar:', error);
      toast.error('Error al conectar con Strava');
      setLoading(false);
    }
  };

  const handleSyncStrava = async () => {
    console.log('[SETTINGS] Iniciando sincronización COMPLETA...');
    setSyncing(true);
    
    // Mostrar toast de inicio
    const loadingToast = toast.loading('Obteniendo TODAS tus actividades históricas de Strava...');
    
    try {
      const result = await activitiesService.syncStravaActivities();
      console.log('[SETTINGS] Sincronización completada:', result);
      
      // Cerrar toast de carga
      toast.dismiss(loadingToast);
      
      // Mostrar resultado
      if (result.created > 0) {
        toast.success(
          `¡Sincronización completada!\n${result.created} actividades nuevas importadas de ${result.total} totales`,
          { duration: 5000 }
        );
      } else if (result.skipped > 0) {
        toast.success(
          `Todas tus ${result.total} actividades ya estaban sincronizadas`,
          { icon: '✓', duration: 4000 }
        );
      } else {
        toast('No se encontraron actividades en Strava');
      }
      
      if (result.errors > 0) {
        toast.error(`${result.errors} actividades tuvieron errores al importar`);
      }
      
      // Recargar la página para actualizar el dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error) {
      console.error('🔴 [SETTINGS] Error al sincronizar:', error);
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.error || 'Error al sincronizar actividades');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-mono font-bold neon-text-cyan">
          CONFIGURACIÓN
        </h1>
        <p className="text-text-secondary font-mono text-xs sm:text-sm mt-2">
          GESTIONA TU CUENTA Y CONEXIONES
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card neon>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-text-primary mb-6">
            INFORMACIÓN DE CUENTA
          </h2>

          <div className="space-y-4">
            <div className="bg-panel-bg p-4">
              <p className="label-text mb-2">EMAIL</p>
              <p className="text-text-primary font-mono">{user?.email}</p>
            </div>

            <div className="bg-panel-bg p-4">
              <p className="label-text mb-2">ID DE USUARIO</p>
              <p className="text-text-secondary font-mono text-sm">{user?.id}</p>
            </div>

            <div className="bg-panel-bg p-4">
              <p className="label-text mb-2">CUENTA CREADA</p>
              <p className="text-text-secondary font-mono text-sm">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }) : '-'}
              </p>
            </div>
          </div>
        </Card>

        <Card neon>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-text-primary mb-6">
            CONEXIÓN CON STRAVA
          </h2>

          {stravaConnected ? (
            <div className="space-y-6">
              <div className="bg-accent-lime/10 border-2 border-accent-lime p-6 text-center">
                <div className="text-4xl mb-4">✓</div>
                <p className="text-accent-lime font-mono font-bold text-lg mb-2">
                  CONECTADO
                </p>
                <p className="text-text-secondary font-mono text-sm">
                  Tu cuenta de Strava está vinculada
                </p>
              </div>

              <div className="bg-panel-bg p-4 space-y-3">
                <h3 className="font-mono font-bold text-text-primary">
                  SINCRONIZACIÓN COMPLETA
                </h3>
                <p className="text-text-secondary font-mono text-sm">
                  Importa TODAS tus actividades históricas de Strava
                </p>
                <ul className="space-y-1 text-text-secondary font-mono text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-accent-pace">▶</span>
                    <span>Obtiene todas las actividades de tu cuenta</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-pace">▶</span>
                    <span>Evita duplicados automáticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-pace">▶</span>
                    <span>Puede tardar unos minutos si tienes muchas actividades</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleSyncStrava}
                loading={syncing}
                className="w-full"
              >
                {syncing ? 'SINCRONIZANDO TODAS LAS ACTIVIDADES...' : 'SINCRONIZAR TODAS LAS ACTIVIDADES'}
              </Button>

              <Button variant="danger" className="w-full">
                DESCONECTAR STRAVA
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-panel-bg p-6 text-center">
                <div className="text-4xl mb-4 text-text-secondary">◯</div>
                <p className="text-text-secondary font-mono text-lg mb-2">
                  NO CONECTADO
                </p>
                <p className="text-text-secondary font-mono text-sm">
                  Conecta tu cuenta de Strava para sincronizar actividades
                </p>
              </div>

              <div className="bg-panel-bg p-4 space-y-3">
                <h3 className="font-mono font-bold text-text-primary">
                  BENEFICIOS DE CONECTAR
                </h3>
                <ul className="space-y-2 text-text-secondary font-mono text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-accent-pace">▶</span>
                    <span>Sincronización automática de actividades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-pace">▶</span>
                    <span>Importar actividades existentes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-pace">▶</span>
                    <span>Datos en tiempo real</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-pace">▶</span>
                    <span>Análisis completo de métricas</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleConnectStrava}
                loading={loading}
                className="w-full"
              >
                {loading ? 'CONECTANDO...' : 'CONECTAR CON STRAVA'}
              </Button>

              <p className="text-text-secondary font-mono text-xs text-center">
                Serás redirigido a Strava para autorizar la conexión
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="text-xl sm:text-2xl font-mono font-bold text-text-primary mb-6">
          PREFERENCIAS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-panel-bg p-4">
            <p className="label-text mb-3">UNIDADES DE DISTANCIA</p>
            <select className="w-full bg-app-bg border-2 border-border-primary px-4 py-3 font-mono text-text-primary focus:border-accent-pace focus:outline-none">
              <option value="km">Kilómetros</option>
              <option value="mi">Millas</option>
            </select>
          </div>

          <div className="bg-panel-bg p-4">
            <p className="label-text mb-3">FORMATO DE RITMO</p>
            <select className="w-full bg-app-bg border-2 border-border-primary px-4 py-3 font-mono text-text-primary focus:border-accent-pace focus:outline-none">
              <option value="min/km">min/km</option>
              <option value="min/mi">min/mi</option>
              <option value="km/h">km/h</option>
            </select>
          </div>

          <div className="bg-panel-bg p-4">
            <p className="label-text mb-3">ZONA HORARIA</p>
            <select className="w-full bg-app-bg border-2 border-border-primary px-4 py-3 font-mono text-text-primary focus:border-accent-pace focus:outline-none">
              <option value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</option>
              <option value="America/New_York">Nueva York (UTC-5)</option>
              <option value="Europe/Madrid">Madrid (UTC+1)</option>
            </select>
          </div>

          <div className="bg-panel-bg p-4">
            <p className="label-text mb-3">IDIOMA</p>
            <select className="w-full bg-app-bg border-2 border-border-primary px-4 py-3 font-mono text-text-primary focus:border-accent-pace focus:outline-none">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button>GUARDAR PREFERENCIAS</Button>
        </div>
      </Card>
    </div>
  );
};
