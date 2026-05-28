import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg mx-2 ${
        isActive
          ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
          : 'text-text-secondary hover:text-text-primary hover:bg-panel-bg-solid/50'
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Botón hamburguesa para móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 glass-panel p-3 text-accent-cyan active:scale-95 transition-transform rounded-lg"
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <span className="text-2xl">{isOpen ? '×' : '☰'}</span>
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 glass-panel h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-6 border-b border-border-primary">
        <h1 className="text-2xl font-bold text-accent-cyan tracking-tight">JNSIX</h1>
        <p className="text-text-secondary text-xs mt-1 font-medium">
          ENDURANCE ANALYTICS
        </p>
      </div>

      <nav className="flex-1 py-4">
        <NavItem to="/dashboard" icon="◆" label="DASHBOARD" onClick={closeSidebar} />
        <NavItem to="/activities" icon="▶" label="ACTIVIDADES" onClick={closeSidebar} />
        <NavItem to="/competitions" icon="🏆" label="COMPETENCIAS" onClick={closeSidebar} />
        <NavItem to="/ai-analysis" icon="◉" label="ANÁLISIS IA" onClick={closeSidebar} />
        <NavItem to="/ai-coach" icon="★" label="COACH IA" onClick={closeSidebar} />
        <NavItem to="/comparisons" icon="◭" label="COMPARACIONES" onClick={closeSidebar} />
        <NavItem to="/settings" icon="◈" label="CONFIGURACIÓN" onClick={closeSidebar} />
      </nav>


      <div className="p-4 border-t border-border-primary">
        <div className="mb-3 p-3 glass-panel">
          <p className="text-text-secondary text-xs mb-1 font-medium">USUARIO</p>
          <p className="text-text-primary text-sm truncate">
            {user?.email}
          </p>
        </div>
        <div className="flex gap-2 mb-3">
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          className="w-full bg-panel-bg-solid border border-border-primary text-text-primary px-4 py-3 text-sm font-medium rounded-lg hover:border-accent-cyan hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all"
        >
          CERRAR SESIÓN
        </button>
      </div>
    </aside>
    </>
  );
};
