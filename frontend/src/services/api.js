import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          Cookies.set('access_token', access, { expires: 1 });

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token inválido, redirecionar para login
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  logout: async () => {
    const refreshToken = Cookies.get('refresh_token');
    if (refreshToken) {
      await api.post('/auth/logout/', { refresh: refreshToken });
    }
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile/update/', userData);
    return response.data;
  },

  changePassword: async (passwords) => {
    const response = await api.post('/auth/change-password/', passwords);
    return response.data;
  },
};

// Serviços de rotas
export const routesAPI = {
  getRoutes: async (params = {}) => {
    const response = await api.get('/routes/', { params });
    return response.data;
  },

  getRoute: async (id) => {
    const response = await api.get(`/routes/${id}/`);
    return response.data;
  },

  createRoute: async (routeData) => {
    const response = await api.post('/routes/', routeData);
    return response.data;
  },

  updateRoute: async (id, routeData) => {
    const response = await api.put(`/routes/${id}/`, routeData);
    return response.data;
  },

  deleteRoute: async (id) => {
    const response = await api.delete(`/routes/${id}/`);
    return response.data;
  },

  optimizeRoute: async (id) => {
    const response = await api.post(`/routes/${id}/optimize/`);
    return response.data;
  },
};

// Serviços de veículos
export const vehiclesAPI = {
  getVehicles: async (params = {}) => {
    const response = await api.get('/vehicles/', { params });
    return response.data;
  },

  getVehicle: async (id) => {
    const response = await api.get(`/vehicles/${id}/`);
    return response.data;
  },

  createVehicle: async (vehicleData) => {
    const response = await api.post('/vehicles/', vehicleData);
    return response.data;
  },

  updateVehicle: async (id, vehicleData) => {
    const response = await api.put(`/vehicles/${id}/`, vehicleData);
    return response.data;
  },

  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}/`);
    return response.data;
  },

  getVehicleTracking: async (id) => {
    const response = await api.get(`/vehicles/${id}/tracking/`);
    return response.data;
  },
};

// Serviços de pontos de coleta
export const collectionPointsAPI = {
  getCollectionPoints: async (params = {}) => {
    const response = await api.get('/collection-points/', { params });
    return response.data;
  },

  getCollectionPoint: async (id) => {
    const response = await api.get(`/collection-points/${id}/`);
    return response.data;
  },

  createCollectionPoint: async (pointData) => {
    console.log('Frontend sending pointData:', JSON.stringify(pointData, null, 2));
    const response = await api.post('/collection-points/', pointData);
    return response.data;
  },

  updateCollectionPoint: async (id, pointData) => {
    const response = await api.put(`/collection-points/${id}/`, pointData);
    return response.data;
  },

  deleteCollectionPoint: async (id) => {
    const response = await api.delete(`/collection-points/${id}/`);
    return response.data;
  },

  recordCollection: async (pointId, collectionData) => {
    const response = await api.post(`/collection-points/${pointId}/collect/`, collectionData);
    return response.data;
  },
};

// Serviços de relatórios
export const reportsAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/reports/dashboard/');
    return response.data;
  },

  getCollectionReport: async (params = {}) => {
    const response = await api.get('/reports/collections/', { params });
    return response.data;
  },

  getEfficiencyReport: async (params = {}) => {
    const response = await api.get('/reports/efficiency/', { params });
    return response.data;
  },

  getCostReport: async (params = {}) => {
    const response = await api.get('/reports/costs/', { params });
    return response.data;
  },

  exportReport: async (reportType, params = {}) => {
    const response = await api.get(`/reports/export/${reportType}/`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// API pública
export const publicAPI = {
  getCollectionSchedule: async (address) => {
    const response = await axios.get(`${API_BASE_URL}/public/schedule/`, {
      params: { address },
    });
    return response.data;
  },

  getPublicStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/public/stats/`);
    return response.data;
  },

  getRouteInfo: async (routeId) => {
    const response = await axios.get(`${API_BASE_URL}/public/routes/${routeId}/`);
    return response.data;
  },
};

export default api;