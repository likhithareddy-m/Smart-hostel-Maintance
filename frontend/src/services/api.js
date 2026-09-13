/**
 * api.js — Centralized API Client
 * IIITDM Jabalpur Smart Hostel Portal Frontend
 *
 * All backend communication goes through this file.
 * Token is stored in localStorage under 'hostel_token'.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'hostel_token';
const USER_KEY  = 'hostel_user';

// -----------------------------------------------------------------------
// Token helpers
// -----------------------------------------------------------------------
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  try {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// -----------------------------------------------------------------------
// Core request helper
// -----------------------------------------------------------------------
async function apiRequest(method, endpoint, body = null) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      // Return error shape consistently
      return {
        success: false,
        message: data.message || `Request failed with status ${response.status}`,
        status: response.status
      };
    }
    return data;
  } catch (err) {
    console.error(`API error [${method} ${endpoint}]:`, err);
    return {
      success: false,
      message: 'Network error. Please check if the backend server is running on port 5000.',
      networkError: true
    };
  }
}

// -----------------------------------------------------------------------
// Auth APIs
// -----------------------------------------------------------------------
export const authAPI = {
  studentLogin: (email, password) =>
    apiRequest('POST', '/auth/student/login', { email, password }),

  studentRegister: (data) =>
    apiRequest('POST', '/auth/student/register', data),

  adminLogin: (email, password) =>
    apiRequest('POST', '/auth/admin/login', { email, password })
};

// -----------------------------------------------------------------------
// Complaints APIs
// -----------------------------------------------------------------------
export const complaintsAPI = {
  submit: (complaintData) =>
    apiRequest('POST', '/complaints', complaintData),

  getMyComplaints: () =>
    apiRequest('GET', '/complaints/my'),

  getById: (id) =>
    apiRequest('GET', `/complaints/${id}`),

  // Admin
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status)     params.append('status',     filters.status);
    if (filters.priority)   params.append('priority',   filters.priority);
    if (filters.category)   params.append('category',   filters.category);
    if (filters.hostel)     params.append('hostel',     filters.hostel);
    if (filters.department) params.append('department', filters.department);
    if (filters.search)     params.append('search',     filters.search);
    const qs = params.toString();
    return apiRequest('GET', `/complaints${qs ? '?' + qs : ''}`);
  },

  updateStatus: (id, status, note) =>
    apiRequest('PATCH', `/complaints/${id}/status`, { status, note }),

  assign: (id, assigned_to, note) =>
    apiRequest('PATCH', `/complaints/${id}/assign`, { assigned_to, note })
};

// -----------------------------------------------------------------------
// Admin APIs
// -----------------------------------------------------------------------
export const adminAPI = {
  getDashboardStats: () =>
    apiRequest('GET', '/admin/dashboard-stats')
};

// -----------------------------------------------------------------------
// Announcements APIs
// -----------------------------------------------------------------------
export const announcementsAPI = {
  getAll: () =>
    apiRequest('GET', '/announcements'),

  create: (title, message) =>
    apiRequest('POST', '/announcements', { title, message })
};
