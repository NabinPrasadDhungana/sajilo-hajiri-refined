import api from "../api/api";

/*
  Lightweight wrapper around src/api/api.js (axios instance).
  - Normalizes paths (accepts '/api/...' or 'dashboard' -> '/api/dashboard/')
  - Returns response.data
  - Throws Error with status + message on non-2xx
*/

const normalize = (path) => {
  if (!path) return "/api/";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return path;
  // if user passed 'dashboard' convert to '/api/dashboard/'
  return `/${path.replace(/^\/+/, "")}`;
};

const handleError = (err) => {
  if (err.response && err.response.data) {
    const data = err.response.data;
    const msg = data.detail || data.error || JSON.stringify(data);
    const e = new Error(msg);
    e.status = err.response.status;
    e.data = data;
    throw e;
  }
  throw err;
};

const inFlightGet = new Map(); // key -> Promise

const userFetch = {
  get: async (path, opts = {}) => {
    try {
      const url = normalize(path);
      const paramsKey = opts.params ? JSON.stringify(opts.params) : '';
      const cacheKey = `${url}|${paramsKey}`;

      // If an identical GET is already in-flight, return the same promise
      if (inFlightGet.has(cacheKey)) {
        return inFlightGet.get(cacheKey);
      }

      const promise = (async () => {
        try {
          const res = await api.get(url, { params: opts.params || {}, ...opts });
          return res.data;
        } finally {
          // remove from cache after settle
          inFlightGet.delete(cacheKey);
        }
      })();

      inFlightGet.set(cacheKey, promise);
      return promise;
    } catch (err) {
      handleError(err);
    }
  },
  post: async (path, body = {}, opts = {}) => {
    try {
      const res = await api.post(normalize(path), body, opts);
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },
  put: async (path, body = {}, opts = {}) => {
    try {
      const res = await api.put(normalize(path), body, opts);
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },
  delete: async (path, opts = {}) => {
    try {
      const res = await api.delete(normalize(path), opts);
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },
    patch: async (path, body = {}, opts = {}) => {
    try {
      const res = await api.patch(normalize(path), body, opts);
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },
};

export default userFetch;
