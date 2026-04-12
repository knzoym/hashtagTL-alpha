import { API_BASE_URL } from './config';

export const api = {
  fetchFiles: () => fetch(`${API_BASE_URL}/files`).then(res => res.json()),
  fetchEvents: () => fetch(`${API_BASE_URL}/events`).then(res => res.json()),
  
  createFile: (data) => fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  
  updateFile: (id, updates) => fetch(`${API_BASE_URL}/files/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }).then(res => res.json()),
  
  deleteFile: (id) => fetch(`${API_BASE_URL}/files/${id}`, { method: 'DELETE' }),

  createEvent: (data) => fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  updateEvent: (id, data) => fetch(`${API_BASE_URL}/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  deleteEvent: (id) => fetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' })
};