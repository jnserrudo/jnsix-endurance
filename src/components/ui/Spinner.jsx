export const Spinner = ({ size = 'md', className = '', text }) => {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Spinner principal con múltiples puntos */}
      <div className="flex items-center gap-2">
        <div className={`animate-pulse-neon text-accent-pace font-mono ${sizes[size]}`}>●</div>
        <div className={`animate-pulse-neon text-accent-lime font-mono ${sizes[size]} animation-delay-200`}>●</div>
        <div className={`animate-pulse-neon text-accent-gold font-mono ${sizes[size]} animation-delay-400`}>●</div>
      </div>
      
      {/* Texto opcional */}
      {text && (
        <p className="text-text-secondary font-mono text-sm sm:text-base animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};
