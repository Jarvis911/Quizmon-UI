import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiHostNeedsNgrokBypass =
  /ngrok/i.test(BASE_URL) || /ngrok-free\.app/i.test(BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for Auth and Organization context
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const organizationId = localStorage.getItem("organizationId");

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    if (organizationId) {
      config.headers["x-organization-id"] = organizationId;
    }

    if (apiHostNeedsNgrokBypass) {
      config.headers["ngrok-skip-browser-warning"] = "true";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Only redirect if not already on login or sign-up page to avoid loops
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/sign-up") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
