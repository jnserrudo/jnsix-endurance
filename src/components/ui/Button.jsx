export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-semibold tracking-tight transition-all relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 active:translate-y-0.5';
  
  const variants = {
    primary: 'bg-accent-cyan text-app-bg hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] hover:-translate-y-0.5',
    secondary: 'bg-panel-bg-solid border border-border-primary text-text-primary hover:border-accent-cyan hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]',
    danger: 'bg-accent-pink text-white hover:shadow-[0_0_20px_rgba(232,93,122,0.4)]',
    ghost: 'bg-transparent border border-transparent text-text-primary hover:border-accent-cyan hover:shadow-[0_0_15px_rgba(0,212,255,0.15)]',
    glass: 'glass-button text-accent-cyan',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-lg',
    lg: 'px-8 py-4 text-lg rounded-xl',
  };
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-pulse">●</span>
          <span>Cargando...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
