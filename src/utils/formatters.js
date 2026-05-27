export const formatTime = (seconds) => {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatPace = (distanceKm, timeSeconds) => {
  if (!distanceKm || !timeSeconds) return '0:00';
  
  const paceMinPerKm = (timeSeconds / 60) / distanceKm;
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDistance = (value) => {
  if (!value) return '0.00';
  // Si el valor es mayor que 1000, asumimos que está en metros
  // Si es menor, asumimos que está en kilómetros
  const km = value > 1000 ? value / 1000 : value;
  return km.toFixed(2);
};

export const formatElevation = (meters) => {
  if (!meters) return '0';
  return Math.round(meters);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatActivityType = (type) => {
  const types = {
    RUN: 'Carrera',
    TRAIL_RUN: 'Trail Running',
    BIKE: 'Ciclismo',
    SWIM: 'Natación',
    OTHER: 'Otro',
  };
  return types[type] || type;
};
