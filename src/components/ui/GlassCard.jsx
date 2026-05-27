import React from 'react';

export const GlassCard = ({ children, className = '', neon = false, ...props }) => {
  const baseClasses = 'glass-card p-6 relative';
  const neonClasses = neon ? 'border-accent-cyan shadow-[0_0_30px_rgba(0,212,255,0.15)]' : '';
  
  return (
    <div className={`${baseClasses} ${neonClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};
