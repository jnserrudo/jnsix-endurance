import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('¡Bienvenido de vuelta!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-neon p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-mono font-bold neon-text-cyan">
              JNSIX
            </h1>
            <p className="text-text-secondary font-mono text-sm">
              ENDURANCE ANALYTICS SYSTEM
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="EMAIL"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />

            <Input
              label="PASSWORD"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              INICIAR SESIÓN
            </Button>
          </form>

          <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />

          <div className="text-center space-y-3">
            <p className="text-text-secondary text-sm font-mono">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="neon-text-cyan hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-text-secondary text-xs font-mono">
            v1.0.0 // ATHLETIC TERMINAL
          </p>
        </div>
      </div>
    </div>
  );
};
