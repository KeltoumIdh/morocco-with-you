import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};

const request = async (method, path, body = null) => {
  const token = await getToken();
  
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body && method !== 'GET') config.body = JSON.stringify(body);

  const res = await fetch(BASE + path, config);
  const data = await res.json().catch(() => ({ error: 'Invalid response' }));

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
};

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
};

// Named helpers
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
};

export const experiencesApi = {
  list:    (params = {}) => api.get('/experiences?' + new URLSearchParams(params)),
  get:     (id)          => api.get(`/experiences/${id}`),
  reviews: (id)          => api.get(`/experiences/${id}/reviews`),
};

/** Public semantic / keyword search over catalogue_embeddings (requires pgvector SQL + embeddings) */
export const searchApi = {
  semantic: (q, params = {}) => {
    const sp = new URLSearchParams({ q, ...params });
    return api.get('/search?' + sp.toString());
  },
};

export const bookingsApi = {
  list:   ()         => api.get('/bookings'),
  get:    (id)       => api.get(`/bookings/${id}`),
  create: (data)     => api.post('/bookings', data),
  cancel: (id)       => api.patch(`/bookings/${id}`, { status: 'cancelled' }),
};

export const itinerariesApi = {
  list:     ()      => api.get('/itineraries'),
  generate: (data)  => api.post('/itineraries/generate', data),
  save:     (id)    => api.post(`/itineraries/${id}/save`),
  delete:   (id)    => api.delete(`/itineraries/${id}`),
};

export const publicItinerariesApi = {
  create: (data) => api.post('/v1/itineraries', data),
  get: (id, token) => api.get(`/v1/itineraries/${id}?` + new URLSearchParams({ token })),
  validate: (id, token) => api.post(`/v1/itineraries/${id}/validate?` + new URLSearchParams({ token })),
};

export const activitiesApi = {
  list:    (p = {}) => api.get('/activities?' + new URLSearchParams(p)),
  get:     (id)     => api.get(`/activities/${id}`),
  reviews: (id)     => api.get(`/activities/${id}/reviews`),
  book:    (id, d)  => api.post(`/activities/${id}/book`, d),
};

export const accommodationsApi = {
  list:   (p = {}) => api.get('/accommodations?' + new URLSearchParams(p)),
  get:    (id)     => api.get(`/accommodations/${id}`),
  cities: ()       => api.get('/accommodations/cities'),
};

export const restaurantsApi = {
  list: (p = {}) => api.get('/restaurants?' + new URLSearchParams(p)),
  get:  (id)     => api.get(`/restaurants/${id}`),
};

export const packagesApi = {
  list:    (p = {}) => api.get('/packages?' + new URLSearchParams(p)),
  get:     (id)     => api.get(`/packages/${id}`),
  book:    (id, d)  => api.post(`/packages/${id}/book`, d),
  request: (data)   => api.post('/planning/request', data),
};

export const providersApi = {
  list: (p = {}) => api.get('/v1/providers?' + new URLSearchParams(p)),
  get:  (id) => api.get(`/v1/providers/${id}`),
};

export const paymentsApi = {
  checkout: (bookingId) =>
    api.post('/payments/create-checkout', { booking_id: bookingId }),
  status: (bookingId) => api.get(`/payments/status/${bookingId}`),
  statusBySession: (sessionId) =>
    api.get(`/payments/status-by-session/${sessionId}`),
};

export const groupTripsApi = {
  list: (p = {}) => api.get('/v1/group-trips?' + new URLSearchParams(p)),
  get: (id) => api.get(`/v1/group-trips/${id}`),
  join: (id, d) => api.post(`/v1/group-trips/${id}/join`, d),
};

export const chatApi = {
  history: ()             => api.get('/chat/history'),
  send:    (data)         => api.post('/chat/message', data),
  /** SSE: calls onEvent for each `{ type, ... }` payload until stream ends */
  async sendStream(body, onEvent) {
    const token = await getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}/chat/message/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response stream');
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';
      for (const block of chunks) {
        const line = block.trim();
        if (!line.startsWith('data:')) continue;
        try {
          const payload = JSON.parse(line.slice(5).trim());
          onEvent(payload);
        } catch {
          /* ignore */
        }
      }
    }
  },
  clear:   ()             => api.delete('/chat/history'),
};

/** Personalised catalogue picks (RAG / vector + cache). Requires auth. */
export const recommendationsApi = {
  get: (limit = 6) => api.post('/v1/recommendations', { limit }),
};

export const profileApi = {
  get:           ()       => api.get('/profile'),
  update:        (data)   => api.patch('/profile', data),
  getSaved:      ()       => api.get('/profile/saved'),
  save:          (id)     => api.post('/profile/saved', { experience_id: id }),
  unsave:        (id)     => api.delete(`/profile/saved/${id}`),
  review:        (data)   => api.post('/reviews', data),
};

export const adminApi = {
  dashboard:    ()        => api.get('/admin/dashboard'),
  experiences:  {
    list:   ()            => api.get('/admin/experiences'),
    create: (data)        => api.post('/admin/experiences', data),
    update: (id, data)    => api.patch(`/admin/experiences/${id}`, data),
    delete: (id)          => api.delete(`/admin/experiences/${id}`),
  },
  bookings: {
    list:   (params = {}) => api.get('/admin/bookings?' + new URLSearchParams(params)),
    update: (id, data)    => api.patch(`/admin/bookings/${id}`, data),
  },
  users: {
    list:   ()            => api.get('/admin/users'),
    update: (id, data)    => api.patch(`/admin/users/${id}`, data),
  },
  posts: {
    list:   ()            => api.get('/admin/posts'),
    create: (data)        => api.post('/admin/posts', data),
    update: (id, data)    => api.patch(`/admin/posts/${id}`, data),
    delete: (id)          => api.delete(`/admin/posts/${id}`),
  },
  commissions: {
    list:   ()            => api.get('/admin/commissions'),
    update: (id, data)    => api.patch(`/admin/commissions/${id}`, data),
    report: (providerId, month) =>
      api.get('/admin/commissions/report?' + new URLSearchParams({ provider_id: providerId, month })),
    sendReport: (providerId, month) =>
      api.post('/admin/commissions/send-report', { provider_id: providerId, month }),
  },
  aiLogs:       ()        => api.get('/admin/ai-logs'),
  ai: {
    metrics: () => api.get('/admin/ai/metrics'),
    suggestItinerary: (requestId) =>
      api.post('/admin/ai/suggest-itinerary', { request_id: requestId }),
    embedAll: (type) =>
      api.post('/admin/ai/embed-all', { type: type ?? null }),
    logs: () => api.get('/admin/ai-logs'),
    evalRuns: () => api.get('/admin/ai/eval/runs'),
    evalRun: (body) => api.post('/admin/ai/eval/run', body),
    evalCompare: (run1, run2) =>
      api.get(
        '/admin/ai/eval/compare?' +
          new URLSearchParams({ run1, run2 }).toString()
      ),
  },
  prompts: {
    list: () => api.get('/admin/ai/prompts'),
    create: (d) => api.post('/admin/ai/prompts', d),
    update: (id, d) => api.patch(`/admin/ai/prompts/${id}`, d),
    activate: (id) => api.post(`/admin/ai/prompts/${id}/activate`),
    invalidateCache: () => api.post('/admin/ai/prompts/invalidate-cache'),
  },
  eventRequests: {
    list:   ()            => api.get('/admin/event-requests'),
    update: (id, data)   => api.patch(`/admin/event-requests/${id}`, data),
  },
};

adminApi.activities = {
  list:   ()           => api.get('/admin/activities'),
  create: (d)          => api.post('/admin/activities', d),
  update: (id, d)      => api.patch(`/admin/activities/${id}`, d),
  delete: (id)         => api.delete(`/admin/activities/${id}`),
  bookings: (params = {}) => api.get('/admin/activity-bookings?' + new URLSearchParams(params)),
};

adminApi.accommodations = {
  list:   ()           => api.get('/admin/accommodations'),
  create: (d)          => api.post('/admin/accommodations', d),
  update: (id, d)      => api.patch(`/admin/accommodations/${id}`, d),
  delete: (id)         => api.delete(`/admin/accommodations/${id}`),
};

adminApi.restaurants = {
  list:   ()           => api.get('/admin/restaurants'),
  create: (d)          => api.post('/admin/restaurants', d),
  update: (id, d)      => api.patch(`/admin/restaurants/${id}`, d),
  delete: (id)         => api.delete(`/admin/restaurants/${id}`),
};

adminApi.packages = {
  list:            ()     => api.get('/admin/packages'),
  create:          (d)    => api.post('/admin/packages', d),
  update:          (id,d) => api.patch(`/admin/packages/${id}`, d),
  delete:          (id)   => api.delete(`/admin/packages/${id}`),
  bookings:        (params = {}) => api.get('/admin/package-bookings?' + new URLSearchParams(params)),
  planningRequests: ()    => api.get('/admin/planning-requests'),
  updateRequest:   (id,d) => api.patch(`/admin/planning-requests/${id}`, d),
};

adminApi.providers = {
  list:          () => api.get('/admin/providers'),
  create:        (d) => api.post('/admin/providers', d),
  update:        (id, d) => api.patch(`/admin/providers/${id}`, d),
  delete:        (id) => api.delete(`/admin/providers/${id}`),
  services:      (id) => api.get(`/admin/providers/${id}/services`),
  createService: (id, d) => api.post(`/admin/providers/${id}/services`, d),
  updateService: (id, d) => api.patch(`/admin/provider-services/${id}`, d),
  deleteService: (id) => api.delete(`/admin/provider-services/${id}`),
};

adminApi.groupTrips = {
  list: () => api.get('/admin/group-trips'),
  create: (d) => api.post('/admin/group-trips', d),
  update: (id, d) => api.patch(`/admin/group-trips/${id}`, d),
  delete: (id) => api.delete(`/admin/group-trips/${id}`),
  enrollments: (id) => api.get(`/admin/group-trips/${id}/enrollments`),
};
