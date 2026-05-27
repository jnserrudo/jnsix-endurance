import { Sidebar } from './Sidebar';

export const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-app-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
};
