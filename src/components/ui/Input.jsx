export const Input = ({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="label-text block">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full bg-panel-bg border-2 border-border-primary
          px-4 py-3 font-mono text-text-primary
          focus:border-accent-pace focus:outline-none
          transition-colors
          ${error ? 'border-neon-pink' : ''}
          ${className}
        `}
        style={{
          clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)'
        }}
        {...props}
      />
      {error && (
        <p className="text-neon-pink text-sm font-mono">{error}</p>
      )}
    </div>
  );
};
