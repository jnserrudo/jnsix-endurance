import { useState } from 'react';
import { Download, FileText, FileJson, Map, File } from 'lucide-react';
import { exportToCSV, exportToJSON, exportToGPX, exportToPDF } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

export const ExportButton = ({ activities, label = 'EXPORTAR' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportCSV = () => {
    try {
      const filename = `activities_${new Date().toISOString().split('T')[0]}.csv`;
      exportToCSV(activities, filename);
      toast.success('Exportado a CSV exitosamente');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al exportar a CSV');
      console.error(error);
    }
  };

  const handleExportJSON = () => {
    try {
      const filename = `activities_${new Date().toISOString().split('T')[0]}.json`;
      exportToJSON(activities, filename);
      toast.success('Exportado a JSON exitosamente');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al exportar a JSON');
      console.error(error);
    }
  };

  const handleExportGPX = () => {
    try {
      const filename = `activities_${new Date().toISOString().split('T')[0]}.gpx`;
      exportToGPX(activities, filename);
      toast.success('Exportado a GPX exitosamente');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al exportar a GPX');
      console.error(error);
    }
  };

  const handleExportPDF = () => {
    try {
      const filename = `activities_${new Date().toISOString().split('T')[0]}.pdf`;
      exportToPDF(activities, filename);
      toast.success('Abriendo vista de impresión para PDF');
      setIsOpen(false);
    } catch (error) {
      toast.error('Error al exportar a PDF');
      console.error(error);
    }
  };

  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-accent-pace hover:bg-accent-pace/80 text-app-bg font-mono font-bold rounded transition-colors"
      >
        <Download size={16} />
        {label}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-panel-bg border border-border-primary rounded-lg shadow-lg z-20">
            <div className="p-2 space-y-1">
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-text-primary font-mono text-sm hover:bg-accent-pace/10 rounded transition-colors"
              >
                <FileText size={16} className="text-accent-cyan" />
                Exportar CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-text-primary font-mono text-sm hover:bg-accent-pace/10 rounded transition-colors"
              >
                <FileJson size={16} className="text-accent-lime" />
                Exportar JSON
              </button>
              <button
                onClick={handleExportGPX}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-text-primary font-mono text-sm hover:bg-accent-pace/10 rounded transition-colors"
              >
                <Map size={16} className="text-accent-gold" />
                Exportar GPX
              </button>
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-text-primary font-mono text-sm hover:bg-accent-pace/10 rounded transition-colors"
              >
                <File size={16} className="text-accent-pink" />
                Exportar PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
