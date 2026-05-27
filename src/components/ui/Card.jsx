export const Card = ({ children, className = '', neon = false }) => {
  return (
    <div className={`${neon ? 'card-neon' : 'card'} ${className}`}>
      {children}
    </div>
  );
};
