import { useEffect } from 'react';
import { Button } from './Button';

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="card-neon p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-mono font-bold neon-text-cyan">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-neon-pink transition-colors font-mono text-2xl"
            >
              ×
            </button>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-accent-pace to-transparent" />
          <div>{children}</div>
          {footer && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
              <div className="flex justify-end gap-3">{footer}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
