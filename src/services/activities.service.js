import api from './api';

export const activitiesService = {
  async getActivities(page = 1, limit = 20) {
    const response = await api.get('/activities', {
      params: { page, limit },
    });
    return response.data;
  },

  async getActivityById(id) {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  async createActivity(data) {
    const response = await api.post('/activities', data);
    return response.data;
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/activities/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async importFromStrava(url) {
    const response = await api.post('/activities/import-link', { url });
    return response.data;
  },

  async shareActivity(id) {
    const response = await api.post(`/activities/${id}/share`);
    return response.data;
  },

  async updateActivity(id, data) {
    const response = await api.put(`/activities/${id}`, data);
    return response.data;
  },

  async deleteActivity(id) {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  },

  async syncStravaActivities() {
    const response = await api.post('/activities/sync-strava');
    return response.data;
  },

  async checkNewActivities() {
    const response = await api.get('/activities/check-new');
    return response.data;
  },

  async createSyncJob(after = null) {
    const response = await api.post('/activities/sync-job', null, {
      params: after ? { after } : {}
    });
    return response.data;
  },

  async getSyncJobStatus(jobId) {
    const response = await api.get(`/activities/sync-job/${jobId}`);
    return response.data;
  },
};
