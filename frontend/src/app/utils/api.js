// API utility — centralized HTTP client for all backend calls
const API_BASE = '/api';

// Get stored JWT token
const getToken = () => localStorage.getItem('token');

// Base fetch wrapper
const apiFetch = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try {
            data = await res.json();
        } catch (e) {
            data = null;
        }
    } else {
        data = { message: await res.text() };
    }

    if (!res.ok) {
        throw new Error(data?.message || `API Error: ${res.status} ${res.statusText}`);
    }

    return data;
};

// ===== Auth =====
export const loginUser = (email, password) =>
    apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

export const registerUser = (email, password, name, role) =>
    apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
    });

export const getCurrentUser = () => apiFetch('/auth/me');

// ===== File Upload =====
export const uploadPoster = async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('poster', file);

    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        data = await res.json();
    } else {
        data = { message: await res.text() };
    }

    if (!res.ok) {
        throw new Error(data?.message || `Upload failed: ${res.status}`);
    }

    return data;
};

// ===== Events =====
export const fetchEvents = () => apiFetch('/events');

export const fetchPastEvents = () => apiFetch('/events/past');

export const fetchEvent = (id) => apiFetch(`/events/${id}`);

export const createEvent = (eventData) =>
    apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
    });

export const updateEvent = (id, updates) =>
    apiFetch(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });

// ===== Clubs =====
export const fetchClubs = () => apiFetch('/clubs');

export const createClub = (clubData) =>
    apiFetch('/clubs', {
        method: 'POST',
        body: JSON.stringify(clubData),
    });

// ===== Registrations =====
export const registerForEvent = (eventId, userData) =>
    apiFetch('/registrations', {
        method: 'POST',
        body: JSON.stringify({ eventId, userData }),
    });

export const getUserRegistrations = () => apiFetch('/registrations/user');

export const checkRegistration = (eventId) =>
    apiFetch(`/registrations/check/${eventId}`);

export const getEventRegistrations = (eventId) =>
    apiFetch(`/registrations/event/${eventId}`);

// ===== Attendance =====
export const markAttendance = (userId, eventId) =>
    apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({ userId, eventId }),
    });

export const getTodayAttendance = () => apiFetch('/attendance/today');

export const getEventAttendance = (eventId) =>
    apiFetch(`/attendance/event/${eventId}`);

// ===== Notifications =====
export const fetchNotifications = () => apiFetch('/notifications');

export const markNotificationRead = (id) =>
    apiFetch(`/notifications/${id}/read`, { method: 'PUT' });

// ===== Requests =====
export const fetchRequests = () => apiFetch('/requests');

export const createRequest = (requestData) =>
    apiFetch('/requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
    });

export const updateRequest = (id, status) =>
    apiFetch(`/requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });

// ===== Users =====
export const getUserProfile = () => apiFetch('/users/profile');

export const updateUserProfile = (updates) =>
    apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
    });

// ===== Volunteer Management =====
export const fetchStudents = () => apiFetch('/users/students');

export const assignVolunteer = (userId) =>
    apiFetch(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'volunteer' }),
    });

export const removeVolunteer = (userId) =>
    apiFetch(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'student' }),
    });

// ===== Volunteer Messaging =====
export const sendVolunteerMessage = (subject, content, volunteerIds) =>
    apiFetch('/notifications/volunteer', {
        method: 'POST',
        body: JSON.stringify({ subject, content, volunteerIds }),
    });

// ===== Transfer Admin =====
export const transferClubAdmin = (targetUserId) =>
    apiFetch('/users/transfer-admin', {
        method: 'PUT',
        body: JSON.stringify({ targetUserId }),
    });

// ===== Club Admin Events =====
export const fetchMyEvents = () => apiFetch('/events/my-events');

export const sendEventMessage = (eventId, subject, content) =>
    apiFetch('/notifications/event-message', {
        method: 'POST',
        body: JSON.stringify({ eventId, subject, content }),
    });
