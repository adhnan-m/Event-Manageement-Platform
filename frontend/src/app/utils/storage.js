// Centralized storage management system
// This provides persistent storage across sessions using localStorage

import { mockEvents, mockPastEvents, mockClubs } from '../data/mockData.js';

const STORAGE_KEYS = {
  USER: 'user',
  EVENTS: 'events',
  PAST_EVENTS: 'pastEvents',
  REGISTRATIONS: 'registrations',
  ATTENDANCE: 'attendance',
  CLUBS: 'clubs',
  NOTIFICATIONS: 'notifications',
  REQUESTS: 'requests',
};

// Initialize default data
const initializeStorage = () => {
  // Import mock data if not already initialized
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(mockEvents));
    localStorage.setItem(STORAGE_KEYS.PAST_EVENTS, JSON.stringify(mockPastEvents));
    localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(mockClubs));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
  }
};

// User Management
export const getUser = () => {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

export const updateUser = (updates) => {
  const user = getUser();
  if (user) {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    return updatedUser;
  }
  return null;
};

// Event Management
export const getEvents = () => {
  initializeStorage();
  const events = localStorage.getItem(STORAGE_KEYS.EVENTS);
  return events ? JSON.parse(events) : [];
};

export const setEvents = (events) => {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
};

export const addEvent = (event) => {
  const events = getEvents();
  const newEvent = {
    ...event,
    id: Date.now().toString(),
    currentParticipants: 0,
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  setEvents(events);
  return newEvent;
};

export const updateEvent = (eventId, updates) => {
  const events = getEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates };
    setEvents(events);
    return events[index];
  }
  return null;
};

export const getPastEvents = () => {
  initializeStorage();
  const events = localStorage.getItem(STORAGE_KEYS.PAST_EVENTS);
  return events ? JSON.parse(events) : [];
};

// Registration Management
export const getRegistrations = () => {
  initializeStorage();
  const registrations = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
  return registrations ? JSON.parse(registrations) : [];
};

export const setRegistrations = (registrations) => {
  localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
};

export const registerForEvent = (userId, eventId, userData) => {
  const registrations = getRegistrations();
  
  // Check if already registered
  const existing = registrations.find(
    r => r.userId === userId && r.eventId === eventId
  );
  
  if (existing) {
    return { success: false, message: 'Already registered for this event' };
  }
  
  const registration = {
    id: Date.now().toString(),
    userId,
    eventId,
    userData,
    registeredAt: new Date().toISOString(),
    attended: false,
  };
  
  registrations.push(registration);
  setRegistrations(registrations);
  
  // Update event participant count
  const events = getEvents();
  const eventIndex = events.findIndex(e => e.id === eventId);
  if (eventIndex !== -1) {
    events[eventIndex].currentParticipants += 1;
    setEvents(events);
  }
  
  // Update user's registered events
  const user = getUser();
  if (user && user.id === userId) {
    const registeredEvents = user.registeredEvents || [];
    registeredEvents.push(eventId);
    updateUser({ 
      registeredEvents,
      eventsParticipated: (user.eventsParticipated || 0) + 1,
    });
  }
  
  return { success: true, registration };
};

export const getUserRegistrations = (userId) => {
  const registrations = getRegistrations();
  return registrations.filter(r => r.userId === userId);
};

export const getEventRegistrations = (eventId) => {
  const registrations = getRegistrations();
  return registrations.filter(r => r.eventId === eventId);
};

export const isUserRegistered = (userId, eventId) => {
  const registrations = getRegistrations();
  return registrations.some(r => r.userId === userId && r.eventId === eventId);
};

// Attendance Management
export const getAttendance = () => {
  initializeStorage();
  const attendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
  return attendance ? JSON.parse(attendance) : [];
};

export const setAttendance = (attendance) => {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
};

export const markAttendance = (userId, eventId, scannedBy) => {
  const registrations = getRegistrations();
  const registration = registrations.find(
    r => r.userId === userId && r.eventId === eventId
  );
  
  if (!registration) {
    return { success: false, message: 'Not registered for this event' };
  }
  
  if (registration.attended) {
    return { success: false, message: 'Attendance already marked' };
  }
  
  // Mark attendance in registrations
  registration.attended = true;
  registration.attendedAt = new Date().toISOString();
  setRegistrations(registrations);
  
  // Add to attendance log
  const attendance = getAttendance();
  const attendanceRecord = {
    id: Date.now().toString(),
    userId,
    eventId,
    scannedBy,
    timestamp: new Date().toISOString(),
  };
  attendance.push(attendanceRecord);
  setAttendance(attendance);
  
  return { success: true, attendanceRecord };
};

export const getUserAttendance = (userId) => {
  const attendance = getAttendance();
  return attendance.filter(a => a.userId === userId);
};

export const getEventAttendance = (eventId) => {
  const attendance = getAttendance();
  return attendance.filter(a => a.eventId === eventId);
};

// Club Management
export const getClubs = () => {
  initializeStorage();
  const clubs = localStorage.getItem(STORAGE_KEYS.CLUBS);
  return clubs ? JSON.parse(clubs) : [];
};

export const setClubs = (clubs) => {
  localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
};

export const addClub = (club) => {
  const clubs = getClubs();
  const newClub = {
    ...club,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  clubs.push(newClub);
  setClubs(clubs);
  return newClub;
};

// Notification Management
export const getNotifications = () => {
  initializeStorage();
  const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return notifications ? JSON.parse(notifications) : [];
};

export const setNotifications = (notifications) => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const addNotification = (notification) => {
  const notifications = getNotifications();
  const newNotification = {
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotification);
  setNotifications(notifications);
  return newNotification;
};

export const markNotificationAsRead = (notificationId) => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications[index].read = true;
    setNotifications(notifications);
  }
};

export const getUserNotifications = (userId) => {
  const notifications = getNotifications();
  return notifications.filter(n => n.userId === userId);
};

// Request Management (for club creation and event approvals)
export const getRequests = () => {
  initializeStorage();
  const requests = localStorage.getItem(STORAGE_KEYS.REQUESTS);
  return requests ? JSON.parse(requests) : [];
};

export const setRequests = (requests) => {
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
};

export const addRequest = (request) => {
  const requests = getRequests();
  const newRequest = {
    ...request,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  requests.push(newRequest);
  setRequests(requests);
  return newRequest;
};

export const updateRequest = (requestId, updates) => {
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index !== -1) {
    requests[index] = { ...requests[index], ...updates };
    setRequests(requests);
    return requests[index];
  }
  return null;
};

// Initialize storage on module load
initializeStorage();