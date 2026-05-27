import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 font-mono text-sm transition-all ${
        isActive
          ? 'bg-accent-pace/10 border-l-2 border-accent-pace text-accent-pace'
          : 'text-text-secondary hover:text-text-primary hover:bg-panel-bg/50'
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
        className="lg:hidden fixed top-4 left-4 z-50 bg-panel-bg border-2 border-accent-pace p-3 text-accent-pace"
        style={{
          clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)'
        }}
      >
        <span className="text-2xl font-mono">{isOpen ? '×' : '☰'}</span>
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-panel-bg border-r-2 border-border-primary h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-6 border-b-2 border-accent-pace">
        <h1 className="text-2xl font-mono font-bold neon-text-cyan">JNSIX</h1>
        <p className="text-text-secondary font-mono text-xs mt-1">
          ENDURANCE ANALYTICS
        </p>
      </div>

      <nav className="flex-1 py-4">
        <NavItem to="/dashboard" icon="◆" label="DASHBOARD" onClick={closeSidebar} />
        <NavItem to="/activities" icon="▶" label="ACTIVIDADES" onClick={closeSidebar} />
        <NavItem to="/ai-analysis" icon="◉" label="ANÁLISIS IA" onClick={closeSidebar} />
        <NavItem to="/comparisons" icon="◭" label="COMPARACIONES" onClick={closeSidebar} />
        <NavItem to="/settings" icon="◈" label="CONFIGURACIÓN" onClick={closeSidebar} />
      </nav>

      <div className="p-4 border-t-2 border-border-primary">
        <div className="mb-3 p-3 bg-app-bg">
          <p className="text-text-secondary font-mono text-xs">USUARIO</p>
          <p className="text-text-primary font-mono text-sm truncate">
            {user?.email}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full btn-secondary text-sm py-2"
        >
          CERRAR SESIÓN
        </button>
      </div>
    </aside>
    </>
  );
};
