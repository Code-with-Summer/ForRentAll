import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000"
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.authorization = token;
  return config;
});

// Redirect to login on 401 Unauthorized
api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;