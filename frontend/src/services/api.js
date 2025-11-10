import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
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
        const refreshToken = Cookies.get("refresh_token");
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );

          const { access } = response.data;
          Cookies.set("access_token", access, { expires: 1 });

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token inválido, redirecionar para login
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post("/auth/login/", { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post("/auth/register/", userData);
    return response.data;
  },

  logout: async () => {
    const refreshToken = Cookies.get("refresh_token");
    if (refreshToken) {
      await api.post("/auth/logout/", { refresh: refreshToken });
    }
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile/");
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put("/auth/profile/update/", userData);
    return response.data;
  },

  changePassword: async (passwords) => {
    const response = await api.post("/auth/change-password/", passwords);
    return response.data;
  },
};

// Serviços de rotas
export const routesAPI = {
  getRoutes: async (params = {}) => {
    const response = await api.get("/routes/", { params });
    return response.data;
  },

  getRoute: async (id) => {
    const response = await api.get(`/routes/${id}/`);
    return response.data;
  },

  createRoute: async (routeData) => {
    const response = await api.post("/routes/", routeData);
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
    const response = await api.get("/vehicles/", { params });
    return response.data;
  },

  getVehicle: async (id) => {
    const response = await api.get(`/vehicles/${id}/`);
    return response.data;
  },

  createVehicle: async (vehicleData) => {
    const response = await api.post("/vehicles/", vehicleData);
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

// Serviços de motoristas
export const driversAPI = {
  getDrivers: async (params = {}) => {
    const response = await api.get("/drivers/", { params });
    return response.data;
  },

  getDriver: async (id) => {
    const response = await api.get(`/drivers/${id}/`);
    return response.data;
  },

  createDriver: async (driverData) => {
    const response = await api.post("/drivers/", driverData);
    return response.data;
  },

  updateDriver: async (id, driverData) => {
    const response = await api.put(`/drivers/${id}/`, driverData);
    return response.data;
  },

  deleteDriver: async (id) => {
    const response = await api.delete(`/drivers/${id}/`);
    return response.data;
  },

  getActiveDrivers: async () => {
    const response = await api.get("/drivers/active/");
    return response.data;
  },

  getExpiredLicenses: async () => {
    const response = await api.get("/drivers/expired_licenses/");
    return response.data;
  },
};

// Serviços de pontos de coleta
export const collectionPointsAPI = {
  getCollectionPoints: async (params = {}) => {
    const response = await api.get("/collection-points/", { params });
    return response.data;
  },

  getCollectionPoint: async (id) => {
    const response = await api.get(`/collection-points/${id}/`);
    return response.data;
  },

  createCollectionPoint: async (pointData) => {
    const response = await api.post("/collection-points/", pointData);
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
    const response = await api.post(
      `/collection-points/${pointId}/collect/`,
      collectionData
    );
    return response.data;
  },

  // Histórico de coletas
  getCollectionHistory: async (pointId, params = {}) => {
    const response = await api.get(
      `/collection-points/${pointId}/collection_history/`,
      { params }
    );
    return response.data;
  },

  // Fotos
  getPhotos: async (pointId) => {
    const response = await api.get(`/collection-points/${pointId}/photos/`);
    return response.data;
  },

  uploadPhoto: async (pointId, photoData) => {
    // Se photoData já é um FormData, usar diretamente
    // Se não, criar um novo FormData
    let formData;
    if (photoData instanceof FormData) {
      formData = photoData;
    } else {
      formData = new FormData();
      for (const key in photoData) {
        formData.append(key, photoData[key]);
      }
    }

    const response = await api.post(
      `/collection-points/${pointId}/photos/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  deletePhoto: async (photoId) => {
    const response = await api.delete(`/photos/${photoId}/`);
    return response.data;
  },

  setPrimaryPhoto: async (photoId) => {
    const response = await api.post(`/photos/${photoId}/set_primary/`);
    return response.data;
  },
};

// Serviços de relatórios
export const reportsAPI = {
  getDashboardStats: async () => {
    const response = await api.get("/reports/dashboard/");
    return response.data;
  },

  getCollectionReport: async (params = {}) => {
    const response = await api.get("/reports/collections/", { params });
    return response.data;
  },

  getEfficiencyReport: async (params = {}) => {
    const response = await api.get("/reports/efficiency/", { params });
    return response.data;
  },

  getCostReport: async (params = {}) => {
    const response = await api.get("/reports/costs/", { params });
    return response.data;
  },

  exportReport: async (reportType, params = {}) => {
    const today = new Date();
    const defaultEnd = today.toISOString().slice(0, 10);
    const startReference = new Date(today);
    startReference.setDate(startReference.getDate() - 30);
    const defaultStart = startReference.toISOString().slice(0, 10);

    const payload = {
      report_type: reportType,
      format: params.format || "csv",
      start_date: params.start_date || defaultStart,
      end_date: params.end_date || defaultEnd,
      filters: params.filters || {},
    };

    const response = await api.post("/reports/export/", payload);
    return response.data;
  },
};

// Serviços de coletas
export const collectionsAPI = {
  getCollections: async (params = {}) => {
    const response = await api.get("/collections/", { params });
    return response.data;
  },

  getCollection: async (id) => {
    const response = await api.get(`/collections/${id}/`);
    return response.data;
  },

  createCollection: async (collectionData) => {
    const response = await api.post("/collections/", collectionData);
    return response.data;
  },

  updateCollection: async (id, collectionData) => {
    const response = await api.put(`/collections/${id}/`, collectionData);
    return response.data;
  },

  deleteCollection: async (id) => {
    const response = await api.delete(`/collections/${id}/`);
    return response.data;
  },

  startCollection: async (id) => {
    const response = await api.post(`/collections/${id}/start/`);
    return response.data;
  },

  completeCollection: async (id) => {
    const response = await api.post(`/collections/${id}/complete/`);
    return response.data;
  },

  cancelCollection: async (id) => {
    const response = await api.post(`/collections/${id}/cancel/`);
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
    const response = await axios.get(
      `${API_BASE_URL}/public/routes/${routeId}/`
    );
    return response.data;
  },
};

export default api;
