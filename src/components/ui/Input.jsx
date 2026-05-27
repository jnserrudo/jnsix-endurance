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
          w-full bg-panel-bg-solid border border-border-primary
          px-4 py-3 text-text-primary rounded-lg
          focus:border-accent-cyan focus:outline-none focus:shadow-[0_0_15px_rgba(0,212,255,0.15)]
          transition-all
          ${error ? 'border-accent-pink' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-accent-pink text-sm">{error}</p>
      )}
    </div>
  );
};
