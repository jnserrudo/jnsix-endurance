import api from './api';

export const comparisonsService = {
  async getComparisons() {
    const response = await api.get('/comparisons');
    return response.data;
  },

  async getComparisonById(id) {
    const response = await api.get(`/comparisons/${id}`);
    return response.data;
  },

  async createComparison(data) {
    const response = await api.post('/comparisons', data);
    return response.data;
  },

  async addActivityToComparison(comparisonId, activityId) {
    const response = await api.post(`/comparisons/${comparisonId}/activities`, {
      activityId,
    });
    return response.data;
  },

  async removeActivityFromComparison(comparisonId, activityId) {
    const response = await api.delete(
      `/comparisons/${comparisonId}/activities/${activityId}`
    );
    return response.data;
  },

  async updateComparison(id, data) {
    const response = await api.put(`/comparisons/${id}`, data);
    return response.data;
  },

  async deleteComparison(id) {
    const response = await api.delete(`/comparisons/${id}`);
    return response.data;
  },
};
