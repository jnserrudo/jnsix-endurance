import api from './api';

export const aiService = {
  async analyzeActivity(activityId, analysisType) {
    const response = await api.post(`/ai/analyze-activity/${activityId}`, {
      analysisType,
    });
    return response.data;
  },

  async analyzeMultipleActivities(activityIds, analysisType) {
    const response = await api.post('/ai/analyze-multiple', {
      activityIds,
      analysisType,
    });
    return response.data;
  },

  async compareActivities(activityIds) {
    const response = await api.post('/ai/compare', {
      activityIds,
    });
    return response.data;
  },

  async analyzeTrends(days) {
    const response = await api.post('/ai/analyze-trends', {
      days,
    });
    return response.data;
  },

  async generateTrainingPlan(data) {
    const response = await api.post('/ai/training-plan', data);
    return response.data;
  },

  async getRaceStrategy(data) {
    const response = await api.post('/ai/race-strategy', data);
    return response.data;
  },

  async predictTime(data) {
    const response = await api.post('/ai/predict-time', data);
    return response.data;
  },

  async getAnalysisHistory() {
    const response = await api.get('/ai/history');
    return response.data;
  },

  async getUsageStats() {
    const response = await api.get('/ai/usage');
    return response.data;
  },
};
