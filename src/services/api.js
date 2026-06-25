import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.DEV ? '' : 'https://exam-b-wedfg.vercel.app',
});

export const apiService = {
  // Student Services
  verifyExam: async (code) => {
    const res = await API.get(`/api/exams/verify/${code}`);
    return res.data;
  },

  registerStudent: async (examId, studentName) => {
    const res = await API.post(`/api/exams/${examId}/register`, { student_name: studentName });
    return res.data;
  },

  getExamData: async (examId, token) => {
    const res = await API.get(`/api/exams/${examId}/take`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  submitExam: async (examId, answers, isCheated, token) => {
    const baseUrl = import.meta.env.DEV ? '' : 'https://exam-b-wedfg.vercel.app';
    const url = `${baseUrl}/api/exams/${examId}/submit`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        answers,
        is_cheated: isCheated
      }),
      keepalive: true
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw { response: { data: errData } };
    }

    return await response.json();
  },

  getExamResult: async (examId, token) => {
    const res = await API.get(`/api/exams/${examId}/result`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Admin Services
  adminLogin: async (username, password) => {
    const res = await API.post('/api/admin/login', { username, password });
    return res.data;
  },

  getDashboardStats: async (token) => {
    const res = await API.get('/api/admin/dashboard-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getExams: async (token) => {
    const res = await API.get('/api/admin/exams', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  createExam: async (examData, token) => {
    const res = await API.post('/api/admin/exams', examData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getExamDetails: async (examId, token) => {
    const res = await API.get(`/api/admin/exams/${examId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteExam: async (examId, token) => {
    const res = await API.delete(`/api/admin/exams/${examId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getResults: async (examId, token) => {
    const params = examId ? { exam_id: examId } : {};
    const res = await API.get('/api/admin/results', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getResultDetails: async (resultId, token) => {
    const res = await API.get(`/api/admin/results/${resultId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteAttempt: async (resultId, token) => {
    const res = await API.delete(`/api/admin/results/${resultId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getExportUrl: (examId) => {
    const token = localStorage.getItem('admin_token') || '';
    const baseUrl = import.meta.env.DEV ? '' : 'https://exam-b-wedfg.vercel.app';
    return `${baseUrl}/api/admin/exams/${examId}/export?token=${token}`;
  },

  getExamStats: async (examId, token) => {
    const res = await API.get(`/api/admin/exams/${examId}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};
