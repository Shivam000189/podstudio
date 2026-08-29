import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

API.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("token");
    
    // Check if Clerk is loaded globally and provide active session token
    if (typeof window !== "undefined" && (window as any).Clerk?.session) {
      try {
        const clerkToken = await (window as any).Clerk.session.getToken();
        if (clerkToken) {
          token = clerkToken;
          localStorage.setItem("token", clerkToken);
        }
      } catch {
        // Fallback to cached token
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
