import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export const StravaCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Error al conectar con Strava');
        navigate('/login');
        return;
      }

      if (token) {
      // Guardar el token en localStorage
      localStorage.setItem('token', token);
      
      // Decodificar el token para obtener el usuario
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[CALLBACK] Payload del token:', payload);
        
        // Obtener el usuario completo del backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('[CALLBACK] Usuario completo del backend:', userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Fallback: usar datos del token
          const user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
          };
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        toast.success('¡Conectado con Strava exitosamente!');
        // Recargar la página para actualizar el contexto de autenticación
        window.location.href = '/settings';
      } catch (err) {
        console.error('🔴 [CALLBACK] Error al procesar token:', err);
        toast.error('Error al procesar la autenticación');
        navigate('/login');
      }
      } else {
        // Si no hay token ni error, redirigir al login
        navigate('/login');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-text-secondary font-mono">PROCESANDO AUTENTICACIÓN...</p>
      </div>
    </div>
  );
};
