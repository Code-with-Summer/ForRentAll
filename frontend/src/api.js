import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000"
});

function getStoredToken() {
  const token = localStorage.getItem("token");
  if (!token || token === "undefined" || token === "null") return "";
  return token;
}

function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("name");
  localStorage.removeItem("email");
  localStorage.removeItem("phone");
  localStorage.removeItem("photo");
}

api.interceptors.request.use(config => {
  const token = getStoredToken();
  if (token) config.headers.authorization = `Bearer ${token}`;
  return config;
});

// Only force logout when the saved token is actually absent/invalid.
api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      const savedToken = getStoredToken();
      const errorText = String(err?.response?.data?.error || "").toLowerCase();
      const tokenInvalid = errorText.includes("invalid token") || errorText.includes("jwt");

      if (!savedToken || tokenInvalid) {
        clearAuthStorage();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
