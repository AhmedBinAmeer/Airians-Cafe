import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
});

api.interceptors.request.use((config) => {
  const auth = localStorage.getItem("airians_auth");
  if (auth) {
    try {
      const { token } = JSON.parse(auth);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      localStorage.removeItem("airians_auth");
    }
  }
  return config;
});

// Auto-logout on 401: token expired or invalid — redirect to /auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("airians_auth");
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong";
}
