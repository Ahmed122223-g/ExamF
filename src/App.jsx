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

// Simple Route Guard to protect admin routes
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/register-student/:examId" element={<RegisterStudent />} />
        <Route path="/take-exam/:examId" element={<TakeExam />} />
        <Route path="/exam-result/:examId" element={<ExamResult />} />

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

        {/* Fallback redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
