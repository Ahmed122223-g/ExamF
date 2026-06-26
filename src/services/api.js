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

  registerStudent: async (examId, token) => {
    const res = await API.post(`/api/exams/${examId}/register`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  studentSignup: async (name, email, password, confirmPassword) => {
    const res = await API.post('/api/students/signup', { name, email, password, confirm_password: confirmPassword });
    return res.data;
  },

  studentVerifyEmail: async (email, code) => {
    const res = await API.post('/api/students/verify-email', { email, code });
    return res.data;
  },

  studentLogin: async (email, password) => {
    const res = await API.post('/api/students/login', { email, password });
    return res.data;
  },

  studentForgotPassword: async (email) => {
    const res = await API.post('/api/students/forgot-password', { email });
    return res.data;
  },

  studentVerifyResetCode: async (email, code) => {
    const res = await API.post('/api/students/verify-reset-code', { email, code });
    return res.data;
  },

  studentResetPassword: async (email, code, password, confirmPassword) => {
    const res = await API.post('/api/students/reset-password', { email, code, password, confirm_password: confirmPassword });
    return res.data;
  },

  studentGetDashboard: async (token) => {
    const res = await API.get('/api/students/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
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
  },

  // Course Services
  registerCourse: async (courseCode, token) => {
    const res = await API.post('/api/courses/register', { course_code: courseCode }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getMyCourses: async (token) => {
    const res = await API.get('/api/courses/my-courses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getCourseRoadmap: async (courseId, token) => {
    const res = await API.get(`/api/courses/${courseId}/roadmap`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  toggleCardCompletion: async (cardDbId, token) => {
    const res = await API.post(`/api/courses/cards/${cardDbId}/complete`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Admin Course Services
  getAdminCourses: async (token) => {
    const res = await API.get('/api/admin/courses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  createCourse: async (courseData, token) => {
    const res = await API.post('/api/admin/courses', courseData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getCourseCardsAdmin: async (courseId, token) => {
    const res = await API.get(`/api/admin/courses/${courseId}/cards`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  createCourseCardAdmin: async (courseId, cardData, token) => {
    const res = await API.post(`/api/admin/courses/${courseId}/cards`, cardData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteCourseCardAdmin: async (courseId, cardDbId, token) => {
    const res = await API.delete(`/api/admin/courses/${courseId}/cards/${cardDbId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateCourseCardAdmin: async (courseId, cardId, cardData, token) => {
    const res = await API.post(`/api/admin/courses/${courseId}/cards/${cardId}`, cardData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  linkExamToCourse: async (examId, courseId, courseCardId, token) => {
    const res = await API.post(`/api/admin/exams/${examId}/link-course`, {}, {
      params: { course_id: courseId, course_card_id: courseCardId },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};

