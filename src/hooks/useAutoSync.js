import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { activitiesService } from '../services/activities.service';
import toast from 'react-hot-toast';

export const useAutoSync = () => {
  const { user, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [hasNewActivities, setHasNewActivities] = useState(false);
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);

  useEffect(() => {
    const checkAndSync = async () => {
      if (!isAuthenticated || !user?.stravaId || isChecking) {
        return;
      }

      setIsChecking(true);
      
      try {
        console.log('🔵 [AUTO SYNC] Verificando nuevas actividades...');
        const result = await activitiesService.checkNewActivities();
        
        console.log('✅ [AUTO SYNC] Resultado:', result);
        
        if (result.hasNew && result.count > 0) {
          setHasNewActivities(true);
          setNewActivitiesCount(result.count);
          
          // Iniciar sincronización automática en background
          console.log('🔵 [AUTO SYNC] Iniciando sincronización automática...');
          const syncResult = await activitiesService.syncStravaActivities();
          
          console.log('✅ [AUTO SYNC] Sincronización completada:', syncResult);
          
          // Mostrar notificación discreta
          if (syncResult.created > 0) {
            toast.success(
              `🔄 ${syncResult.created} actividades nuevas sincronizadas automáticamente`,
              { 
                duration: 4000,
                position: 'top-right'
              }
            );
          }
          
          setHasNewActivities(false);
          setNewActivitiesCount(0);
        } else {
          console.log('✅ [AUTO SYNC] No hay actividades nuevas');
        }
      } catch (error) {
        console.error('🔴 [AUTO SYNC] Error:', error);
        // No mostrar error al usuario, es silencioso
      } finally {
        setIsChecking(false);
      }
    };

    // Esperar 2 segundos antes de verificar para no bloquear el login
    const timer = setTimeout(() => {
      checkAndSync();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.stravaId, isChecking]);

  return {
    isChecking,
    hasNewActivities,
    newActivitiesCount,
    manualSync: async () => {
      try {
        const result = await activitiesService.syncStravaActivities();
        if (result.created > 0) {
          toast.success(`${result.created} actividades sincronizadas`);
        }
        return result;
      } catch (error) {
        toast.error('Error al sincronizar');
        throw error;
      }
    }
  };
};
