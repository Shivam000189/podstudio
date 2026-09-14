import axios from "axios";

const getBaseURL = () => {
  let url = (import.meta.env.VITE_API_URL || "/api").trim();
  // Remove trailing slashes
  url = url.replace(/\/+$/, "");
  // If user provided origin like https://podstudio.onrender.com without /api, ensure /api is present
  if (url.startsWith("http") && !url.endsWith("/api") && !url.includes("/api/")) {
    return `${url}/api`;
  }
  return url;
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Token resolver — set by useAuth hook when Clerk is active, so we can
// always fetch a fresh Clerk session token on every API request.
let _clerkTokenResolver: (() => Promise<string | null>) | null = null;

export function setClerkTokenResolver(resolver: () => Promise<string | null>) {
  _clerkTokenResolver = resolver;
}

export function clearClerkTokenResolver() {
  _clerkTokenResolver = null;
}

API.interceptors.request.use(
  async (config) => {
    let token: string | null = null;

    // If Clerk is managing auth, always get a fresh session token
    if (_clerkTokenResolver) {
      try {
        token = await _clerkTokenResolver();
        if (token) {
          // Cache in localStorage so other parts of the app can check auth state
          localStorage.setItem("token", token);
        }
      } catch {
        // Clerk resolver failed — fall through to localStorage
      }
    }

    // Fallback to localStorage (email/password login flow)
    if (!token) {
      token = localStorage.getItem("token");
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
      // Only redirect to login if Clerk is NOT managing the session.
      // When Clerk is active, the useAuth hook handles auth state — a 401
      // just means the token expired and Clerk will refresh it automatically.
      if (!_clerkTokenResolver) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
