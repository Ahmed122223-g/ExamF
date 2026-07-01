import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import RegisterStudent from './pages/RegisterStudent';
import TakeExam from './pages/TakeExam';
import ExamResult from './pages/ExamResult';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminExams from './pages/AdminExams';
import AdminResults from './pages/AdminResults';
import AdminStats from './pages/AdminStats';
import AdminEditCard from './pages/AdminEditCard';
import AdminStudents from './pages/AdminStudents';

import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import StudentForgotPassword from './pages/StudentForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import CourseRoadmap from './pages/CourseRoadmap';
import CardDetail from './pages/CardDetail';
import Notifications from './pages/Notifications';
import AdminReview from './pages/AdminReview';
import QuestionFeedbackDetail from './pages/QuestionFeedbackDetail';

// Simple Route Guard to protect admin routes
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/admin/login" replace />;
};

import { useEffect } from 'react';
import { apiService } from './services/api';

// Simple Route Guard to protect student routes
const StudentRoute = ({ children }) => {
  const token = localStorage.getItem('student_token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  useEffect(() => {
    // Ping backend to track active time every 20 seconds
    const interval = setInterval(() => {
      const studentToken = localStorage.getItem('student_token');
      if (studentToken) {
        apiService.trackActive(studentToken).catch(err => {
          // If token expired/invalid, let dashboard handle redirection
          console.warn("Active tracking error", err);
        });
      }
    }, 20000);

    // Initial ping
    const studentToken = localStorage.getItem('student_token');
    if (studentToken) {
      apiService.trackActive(studentToken).catch(() => {});
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Student Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/forgot-password" element={<StudentForgotPassword />} />
        <Route 
          path="/dashboard" 
          element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          } 
        />
        <Route 
          path="/course/:courseId/roadmap" 
          element={
            <StudentRoute>
              <CourseRoadmap />
            </StudentRoute>
          } 
        />
        <Route 
          path="/course/:courseId/card/:cardDbId" 
          element={
            <StudentRoute>
              <CardDetail />
            </StudentRoute>
          } 
        />
        <Route 
          path="/register-student/:examId" 
          element={
            <StudentRoute>
              <RegisterStudent />
            </StudentRoute>
          } 
        />
        <Route 
          path="/take-exam/:examId" 
          element={
            <StudentRoute>
              <TakeExam />
            </StudentRoute>
          } 
        />
        <Route 
          path="/exam-result/:examId" 
          element={
            <StudentRoute>
              <ExamResult />
            </StudentRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <StudentRoute>
              <Notifications />
            </StudentRoute>
          } 
        />
        <Route 
          path="/card-feedback/:cardDbId" 
          element={
            <StudentRoute>
              <QuestionFeedbackDetail />
            </StudentRoute>
          } 
        />

        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/exams" 
          element={
            <AdminRoute>
              <AdminExams />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/results" 
          element={
            <AdminRoute>
              <AdminResults />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/exams/:id/stats" 
          element={
            <AdminRoute>
              <AdminStats />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/courses/:courseId/cards/:cardId" 
          element={
            <AdminRoute>
              <AdminEditCard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/students" 
          element={
            <AdminRoute>
              <AdminStudents />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/review" 
          element={
            <AdminRoute>
              <AdminReview />
            </AdminRoute>
          } 
        />

        {/* Fallback redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
