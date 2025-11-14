// src/api/api.js
import axios from "axios";

// Create an axios instance with a base URL
const api = axios.create({
  baseURL: "http://localhost:8000/", // Django backend URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Add this line
});

// Add request interceptor to attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access"); // stored by AuthContext or login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// small helper to decode JWT payload
const parseJwt = (token) => {
	// token like header.payload.signature
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map(function(c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch (e) {
		return null;
	}
};

// Optional: Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    // If this response is from the token obtain endpoint, persist tokens + basic user info
    try {
      const url = response?.config?.url || '';
      // backend token endpoint: /api/token/
      if (url.includes('/api/token/') && response.data) {
        const { access, refresh } = response.data;
        if (access) {
          localStorage.setItem('access', access);
        }
        if (refresh) {
          localStorage.setItem('refresh', refresh);
        }
        // decode access token for common claims
        if (access) {
          const payload = parseJwt(access);
          if (payload) {
            const userObj = {
              // common claim keys: email, user_id, id, role, username
              email: payload.email || payload.username || null,
              id: payload.user_id ?? payload.id ?? payload.pk ?? null,
              role: payload.role ?? null,
              username: payload.username ?? null,
            };
            // Remove undefined fields
            Object.keys(userObj).forEach(k => userObj[k] === null && delete userObj[k]);
            if (Object.keys(userObj).length) {
              localStorage.setItem('user', JSON.stringify(userObj));
            }
          }
        }
        // ensure axios instance sends new token
        if (access) api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      }
    } catch (e) {
      // swallow any parsing error
      console.warn('Token post-processing failed', e);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try refreshing
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        try {
          const res = await axios.post("http://localhost:8000/api/token/refresh/", {
            refresh,
          });
          localStorage.setItem("access", res.data.access);
          // Retry original request with new token
          api.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (err) {
          console.error("Refresh token expired. Logging out...");
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
