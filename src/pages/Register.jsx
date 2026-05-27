import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-neon p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-mono font-bold neon-text-lime">
              REGISTRO
            </h1>
            <p className="text-text-secondary font-mono text-sm">
              CREAR NUEVA CUENTA
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-accent-elevation to-transparent" />

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

            <Input
              label="CONFIRMAR PASSWORD"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              variant="primary"
            >
              CREAR CUENTA
            </Button>
          </form>

          <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />

          <div className="text-center space-y-3">
            <p className="text-text-secondary text-sm font-mono">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="neon-text-cyan hover:underline">
                Inicia sesión
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
