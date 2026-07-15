import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.DEV ? '' : 'https://exam-b-wedfg.vercel.app',
});

export const apiService = {
  verifyExam: async (code) => {
    const token = sessionStorage.getItem(`student_token_${code}`) || localStorage.getItem('student_token') || '';
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await API.get(`/api/exams/verify/${code}`, { headers });
    return res.data;
  },

  getServerTime: async () => {
    const res = await API.get('/api/exams/server-time');
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

  trackActive: async (token) => {
    const res = await API.post('/api/students/track-active', {}, {
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

  getCourseLeaderboard: async (courseId, token) => {
    const res = await API.get(`/api/courses/${courseId}/leaderboard`, {
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

  getCourseDependencies: async (courseId, token) => {
    const res = await API.get(`/api/courses/${courseId}/dependencies`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  addCourseDependency: async (courseId, dependantCourseId, token) => {
    const res = await API.post(`/api/courses/${courseId}/dependencies`, {
      dependant_course_id: dependantCourseId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteCourseDependency: async (courseId, dependantCourseId, token) => {
    const res = await API.delete(`/api/courses/${courseId}/dependencies/${dependantCourseId}`, {
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

  getCourseSectionsAdmin: async (courseId, token) => {
    const res = await API.get(`/api/admin/courses/${courseId}/sections`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  createCourseSectionAdmin: async (courseId, sectionData, token) => {
    const res = await API.post(`/api/admin/courses/${courseId}/sections`, sectionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateCourseSectionAdmin: async (courseId, sectionId, sectionData, token) => {
    const res = await API.put(`/api/admin/courses/${courseId}/sections/${sectionId}`, sectionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteCourseSectionAdmin: async (courseId, sectionId, token) => {
    const res = await API.delete(`/api/admin/courses/${courseId}/sections/${sectionId}`, {
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
  },

  // ── Card Questions - Admin ────────────────────────────────────────────────
  getCardQuestionsAdmin: async (courseId, cardDbId, token) => {
    const res = await API.get(`/api/admin/courses/${courseId}/cards/${cardDbId}/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  createCardQuestion: async (courseId, cardDbId, data, token) => {
    const res = await API.post(`/api/admin/courses/${courseId}/cards/${cardDbId}/questions`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  updateCardQuestion: async (courseId, cardDbId, questionId, data, token) => {
    const res = await API.put(`/api/admin/courses/${courseId}/cards/${cardDbId}/questions/${questionId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  deleteCardQuestion: async (courseId, cardDbId, questionId, token) => {
    const res = await API.delete(`/api/admin/courses/${courseId}/cards/${cardDbId}/questions/${questionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // ── Card Questions - Student ──────────────────────────────────────────────
  getCardQuestionsStudent: async (cardDbId, token) => {
    const res = await API.get(`/api/courses/cards/${cardDbId}/questions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  submitQuestionAnswer: async (questionId, data, token) => {
    const res = await API.post(`/api/courses/questions/${questionId}/answer`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // ── Project Submissions ──
  getProjectSubmission: async (cardDbId, token) => {
    const res = await API.get(`/api/courses/cards/${cardDbId}/project-submission`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  submitProjectSolution: async (cardDbId, data, token) => {
    const res = await API.post(`/api/courses/cards/${cardDbId}/project-submit`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getProjectSubmissionsAdmin: async (token) => {
    const res = await API.get(`/api/admin/project-submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  reviewProjectSubmissionAdmin: async (submissionId, data, token) => {
    const res = await API.post(`/api/admin/project-submissions/${submissionId}/review`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // ── Notifications - Student ────────────────────────────────────────────────
  getMyNotifications: async (token) => {
    const res = await API.get('/api/courses/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  markNotificationRead: async (notifId, token) => {
    const res = await API.put(`/api/courses/notifications/${notifId}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  markAllNotificationsRead: async (token) => {
    const res = await API.put('/api/courses/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // ── Students Overview - Admin ──────────────────────────────────────────────
  getStudentsOverview: async (token) => {
    const res = await API.get('/api/admin/students-overview', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getCardQuestionAnswersAdmin: async (cardDbId, token) => {
    const res = await API.get(`/api/admin/cards/${cardDbId}/question-answers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // ── Notifications - Admin ──────────────────────────────────────────────────
  sendNotification: async (data, token) => {
    const res = await API.post('/api/admin/notifications', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  getSentNotificationsAdmin: async (token) => {
    const res = await API.get('/api/admin/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // ── Question Answers Review - Admin ───────────────────────────────────────
  getCardsWithAnswersAdmin: async (token) => {
    const res = await API.get('/api/admin/cards-with-answers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  sendAnswerFeedbackAdmin: async (answerId, feedbackText, token) => {
    const res = await API.post(`/api/admin/question-answers/${answerId}/feedback`,
      { feedback_text: feedbackText },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  reviewAnswerAdmin: async (answerId, token) => {
    const res = await API.post(`/api/admin/question-answers/${answerId}/review`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  // ── My Question Feedback - Student ────────────────────────────────────────
  getMyAnswerFeedback: async (cardDbId, token) => {
    const res = await API.get(`/api/courses/cards/${cardDbId}/my-feedback`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // ── Delete Student - Admin ────────────────────────────────────────────────
  deleteStudent: async (studentId, token) => {
    const res = await API.delete(`/api/admin/students/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // ── Card Exceptions - Admin ────────────────────────────────────────────────
  getStudentCardExceptions: async (studentId, token) => {
    const res = await API.get(`/api/admin/students/${studentId}/card-exceptions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  grantStudentCardException: async (studentId, courseCardId, token) => {
    const res = await API.post(`/api/admin/students/${studentId}/card-exceptions`,
      { course_card_id: courseCardId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  revokeStudentCardException: async (studentId, courseCardId, token) => {
    const res = await API.delete(`/api/admin/students/${studentId}/card-exceptions/${courseCardId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },
};

