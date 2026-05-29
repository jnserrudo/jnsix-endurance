import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { activitiesService } from '../services/activities.service';
import toast from 'react-hot-toast';

export const useAutoSync = () => {
  const { user, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [hasNewActivities, setHasNewActivities] = useState(false);
  const [newActivitiesCount, setNewActivitiesCount] = useState(0);
  const pollingIntervalRef = useRef(null);
  const jobIdRef = useRef(null);
  const hasCheckedRef = useRef(false);

  const pollJobStatus = useCallback(async (jobId) => {
    try {
      const job = await activitiesService.getSyncJobStatus(jobId);
      
      setSyncProgress(job.progress || 0);
      
      if (job.status === 'completed') {
        setIsSyncing(false);
        setSyncProgress(100);
        toast.success(
          `Sincronización completada: ${job.processed} actividades procesadas`,
          { duration: 4000, position: 'top-right' }
        );
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      } else if (job.status === 'failed') {
        setIsSyncing(false);
        setSyncProgress(0);
        toast.error(
          `Error en sincronización: ${job.error || 'Error desconocido'}`,
          { duration: 5000, position: 'top-right' }
        );
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      }
    } catch (error) {
      console.error('� [POLL JOB] Error:', error);
    }
  }, []);

  const startSyncJob = useCallback(async (after = null) => {
    try {
      setIsSyncing(true);
      setSyncProgress(0);
      
      const { jobId } = await activitiesService.createSyncJob(after);
      jobIdRef.current = jobId;
      
      toast.loading('Iniciando sincronización...', { id: 'sync-toast' });
      
      // Poll cada 1 segundo
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(jobId);
      }, 1000);
      
    } catch (error) {
      console.error('🔴 [START SYNC JOB] Error:', error);
      setIsSyncing(false);
      toast.error('Error al iniciar sincronización');
    }
  }, [pollJobStatus]);

  useEffect(() => {
    const checkAndSync = async () => {
      if (!isAuthenticated || !user?.stravaId || isChecking || isSyncing || hasCheckedRef.current) {
        return;
      }

      hasCheckedRef.current = true;
      setIsChecking(true);
      
      try {
        console.log('[AUTO SYNC] Verificando nuevas actividades...');
        const result = await activitiesService.checkNewActivities();
        
        console.log('[AUTO SYNC] Resultado:', result);
        
        if (result.hasNew && result.count > 0) {
          setHasNewActivities(true);
          setNewActivitiesCount(result.count);
          
          // Iniciar sincronización automática en background con job
          console.log('[AUTO SYNC] Iniciando job de sincronización...');
          await startSyncJob(result.lastSyncDate);
          
          setHasNewActivities(false);
          setNewActivitiesCount(0);
        } else {
          console.log('[AUTO SYNC] No hay actividades nuevas');
        }
      } catch (error) {
        console.error('[AUTO SYNC] Error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    // Esperar 2 segundos antes de verificar para no bloquear el login
    const timer = setTimeout(() => {
      checkAndSync();
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAuthenticated, user?.stravaId, startSyncJob]);

  return {
    isChecking,
    isSyncing,
    syncProgress,
    hasNewActivities,
    newActivitiesCount,
    manualSync: async () => {
      await startSyncJob();
    }
  };
};
