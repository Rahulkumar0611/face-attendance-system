/**
 * API utility for making HTTP requests to the backend.
 */
import axios from 'axios';

// Use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Student APIs
export const studentAPI = {
    register: async (formData) => {
        const response = await api.post('/api/students/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getAll: async () => {
        const response = await api.get('/api/students/');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/api/students/${id}`);
        return response.data;
    },

    update: async (id, data) => {
        // Backend expects Form data, not JSON
        const formData = new FormData();
        if (data.name) formData.append('name', data.name);
        if (data.email) formData.append('email', data.email);
        if (data.enrollment_id) formData.append('enrollment_id', data.enrollment_id);
        if (data.role) formData.append('role', data.role);

        const response = await api.put(`/api/students/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/api/students/${id}`);
        return response.data;
    },

    deleteAll: async () => {
        const response = await api.delete('/api/students/all');
        return response.data;
    },
};

// Alias for plural naming convention
export const studentsAPI = studentAPI;

// Attendance APIs
export const attendanceAPI = {
    mark: async (formData) => {
        const response = await api.post('/api/attendance/mark', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getToday: async () => {
        const response = await api.get('/api/attendance/today');
        return response.data;
    },

    getStudentHistory: async (studentId, limit = 30) => {
        const response = await api.get(`/api/attendance/student/${studentId}`, {
            params: { limit },
        });
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/api/attendance/stats');
        return response.data;
    },

    resetToday: async () => {
        // Correct endpoint is /today/clear
        const response = await api.delete('/api/attendance/today/clear');
        return response.data;
    },
};

export default api;
