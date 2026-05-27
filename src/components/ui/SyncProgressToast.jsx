import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const SyncProgressToast = ({ 
  isSyncing, 
  progress = 0, 
  total = 0, 
  created = 0, 
  skipped = 0,
  onClose 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isSyncing) return null;

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-panel-bg border-2 border-accent-pace rounded-lg shadow-2xl animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-accent-pace rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-accent-pace rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-accent-pace rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="font-mono font-bold text-text-primary text-sm">
            SINCRONIZANDO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-text-secondary">Progreso</span>
              <span className="text-accent-pace font-bold">{percentage}%</span>
            </div>
            <div className="w-full bg-border-primary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-pace to-accent-lime transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-text-secondary">
              <span>{progress} / {total}</span>
              <span>{created} creadas</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-panel-bg p-2 rounded border border-border-primary">
              <p className="text-text-secondary mb-1">Creadas</p>
              <p className="font-mono font-bold text-accent-lime">{created}</p>
            </div>
            <div className="bg-panel-bg p-2 rounded border border-border-primary">
              <p className="text-text-secondary mb-1">Omitidas</p>
              <p className="font-mono font-bold text-text-primary">{skipped}</p>
            </div>
          </div>

          {/* Message */}
          <p className="text-text-secondary font-mono text-xs text-center">
            {percentage < 100 
              ? 'Obteniendo actividades de Strava...' 
              : 'Finalizando sincronización...'}
          </p>
        </div>
      )}
    </div>
  );
};
