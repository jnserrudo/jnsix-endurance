export const exportToCSV = (activities, filename = 'activities.csv') => {
  if (!activities || activities.length === 0) {
    return;
  }

  // Definir columnas
  const headers = [
    'ID',
    'Nombre',
    'Tipo',
    'Fecha',
    'Distancia (km)',
    'Tiempo (seg)',
    'Pace (min/km)',
    'Elevación (m)',
    'HR Promedio',
    'HR Máxima',
    'Calorías'
  ];

  // Convertir datos a filas CSV
  const rows = activities.map(act => [
    act.id || '',
    `"${(act.name || 'Sin nombre').replace(/"/g, '""')}"`,
    act.type || '',
    act.startDate ? new Date(act.startDate).toISOString() : '',
    (act.distanceKm || 0).toFixed(2),
    act.movingTime || 0,
    act.movingTime && act.distanceKm > 0 
      ? ((act.movingTime / 60) / act.distanceKm).toFixed(2)
      : 0,
    Math.round(act.elevationM || 0),
    act.averageHr || 0,
    act.maxHr || 0,
    act.calories || 0
  ]);

  // Crear contenido CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (activities, filename = 'activities.json') => {
  if (!activities || activities.length === 0) {
    return;
  }

  const jsonContent = JSON.stringify(activities, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToGPX = (activities, filename = 'activities.gpx') => {
  if (!activities || activities.length === 0) {
    return;
  }

  // Crear contenido GPX básico
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Athletic Terminal" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Activities Export</name>
    <trkseg>`;

  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  const trkpts = activities
    .filter(act => act.rawData && act.rawData.start_latlng)
    .map(act => {
      const coords = act.rawData.start_latlng;
      if (coords && coords.length >= 2) {
        return `      <trkpt lat="${coords[0]}" lon="${coords[1]}">
        <time>${act.startDate ? new Date(act.startDate).toISOString() : ''}</time>
        <name>${(act.name || 'Sin nombre').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</name>
      </trkpt>`;
      }
      return '';
    })
    .join('\n');

  const gpxContent = gpxHeader + trkpts + gpxFooter;
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (activities, filename = 'activities.pdf') => {
  if (!activities || activities.length === 0) {
    return;
  }

  // Crear contenido HTML para imprimir
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Activities Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #00E5FF; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background-color: #1a1a2e; color: #00E5FF; }
    tr:nth-child(even) { background-color: #f0f0f0; }
  </style>
</head>
<body>
  <h1>Athletic Terminal - Activities Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <p>Total Activities: ${activities.length}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Name</th>
        <th>Type</th>
        <th>Distance (km)</th>
        <th>Time</th>
        <th>Pace (min/km)</th>
        <th>Elevation (m)</th>
        <th>Avg HR</th>
      </tr>
    </thead>
    <tbody>
      ${activities.map(act => {
        const pace = act.movingTime && act.distanceKm > 0 
          ? ((act.movingTime / 60) / act.distanceKm).toFixed(2)
          : '-';
        return `
        <tr>
          <td>${act.startDate ? new Date(act.startDate).toLocaleDateString() : '-'}</td>
          <td>${act.name || 'Sin nombre'}</td>
          <td>${act.type || '-'}</td>
          <td>${(act.distanceKm || 0).toFixed(2)}</td>
          <td>${Math.floor((act.movingTime || 0) / 60)}:${String(Math.floor((act.movingTime || 0) % 60)).padStart(2, '0')}</td>
          <td>${pace}</td>
          <td>${Math.round(act.elevationM || 0)}</td>
          <td>${act.averageHr || '-'}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</body>
</html>`;

  // Crear una ventana nueva para imprimir
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Esperar a que cargue y luego imprimir
  setTimeout(() => {
    printWindow.print();
  }, 500);
};
