export const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseClasses = 'animate-pulse bg-panel-bg';
  
  const variantClasses = {
    default: 'rounded',
    circle: 'rounded-full',
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    card: 'rounded-lg'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

export const ActivityCardSkeleton = () => {
  return (
    <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-20 h-6" variant="text" />
        <Skeleton className="w-24 h-4" variant="text" />
      </div>
      <Skeleton className="w-3/4 h-6 mb-2" variant="title" />
      <div className="flex gap-4 mt-3">
        <Skeleton className="w-16 h-4" variant="text" />
        <Skeleton className="w-16 h-4" variant="text" />
        <Skeleton className="w-16 h-4" variant="text" />
      </div>
    </div>
  );
};

export const DashboardCardSkeleton = () => {
  return (
    <div className="bg-panel-bg border border-border-primary rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5" variant="circle" />
        <Skeleton className="w-32 h-6" variant="title" />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-full h-4" variant="text" />
        <Skeleton className="w-3/4 h-4" variant="text" />
        <Skeleton className="w-1/2 h-4" variant="text" />
      </div>
    </div>
  );
};

export const StatCardSkeleton = () => {
  return (
    <div className="bg-panel-bg border border-border-primary rounded-lg p-4">
      <Skeleton className="w-24 h-4 mb-2" variant="text" />
      <Skeleton className="w-20 h-8" variant="title" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-3 border-b border-border-primary">
        <Skeleton className="w-1/4 h-4" variant="text" />
        <Skeleton className="w-1/4 h-4" variant="text" />
        <Skeleton className="w-1/4 h-4" variant="text" />
        <Skeleton className="w-1/4 h-4" variant="text" />
      </div>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex gap-4 p-3">
          <Skeleton className="w-1/4 h-4" variant="text" />
          <Skeleton className="w-1/4 h-4" variant="text" />
          <Skeleton className="w-1/4 h-4" variant="text" />
          <Skeleton className="w-1/4 h-4" variant="text" />
        </div>
      ))}
    </div>
  );
};
