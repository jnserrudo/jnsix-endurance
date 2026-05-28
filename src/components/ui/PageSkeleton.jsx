export const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-bg-primary p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 sm:h-10 bg-panel-bg-solid rounded-lg w-1/3 mb-2"></div>
        <div className="h-4 bg-panel-bg-solid rounded-lg w-1/2"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-4 sm:p-6 rounded-lg">
            <div className="h-6 bg-panel-bg-solid rounded-lg w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-panel-bg-solid rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <div className="glass-panel p-4 sm:p-6 rounded-lg">
            <div className="h-6 bg-panel-bg-solid rounded-lg w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-panel-bg-solid rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
