import api from './api';

export const competitionsService = {
  async getCompetitions() {
    const response = await api.get('/competitions');
    return response.data;
  },

  async createCompetition(data) {
    const response = await api.post('/competitions', data);
    return response.data;
  },

  async updateCompetition(id, data) {
    const response = await api.put(`/competitions/${id}`, data);
    return response.data;
  },

  async deleteCompetition(id) {
    const response = await api.delete(`/competitions/${id}`);
    return response.data;
  },

  async associateSimulation(competitionId, activityId, remove = false) {
    const response = await api.post(`/competitions/${competitionId}/simulate`, {
      activityId,
      remove
    });
    return response.data;
  }
};
export default competitionsService;
