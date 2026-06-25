import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaEdit, FaTrash, FaSignOutAlt, FaChartBar, FaUserGraduate, FaClipboardList, FaFileExcel, FaPlus, FaCopy } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        const statsData = await apiService.getDashboardStats(token);
        setStats(statsData);
        
        const examsData = await apiService.getExams(token);
        setExams(examsData);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
        } else {
          Swal.fire('خطأ!', 'فشل في تحميل بيانات لوحة التحكم.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin/login');
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
      title: 'تم النسخ!',
      text: `كود الاختبار ${code} تم نسخه للحافظة.`,
      icon: 'success',
      timer: 1000,
      showConfirmButton: false
    });
  };

  const handleDeleteExam = async (examId) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'حذف هذا الاختبار سيؤدي إلى حذف جميع الأسئلة المرتبطة به، وحذف جميع نتائج وإجابات الطلاب نهائياً!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteExam(examId, token);
          setExams(prev => prev.filter(e => e.id !== examId));
          // Refresh stats
          const statsData = await apiService.getDashboardStats(token);
          setStats(statsData);
          Swal.fire('تم الحذف!', 'تم حذف الاختبار وجميع البيانات بنجاح.', 'success');
        } catch (err) {
          Swal.fire('خطأ!', 'فشل في حذف الاختبار.', 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#090d16' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Top Navbar */}
      <nav className="navbar">
        <Link to="/admin/dashboard" className="nav-brand">
          منصة الاختبارات الإلكترونية <span>لوحة التحكم</span>
        </Link>
        <div className="nav-links">
          <Link to="/admin/dashboard" className="nav-btn active">الرئيسية</Link>
          <Link to="/admin/exams" className="nav-btn">إدارة الاختبارات</Link>
          <Link to="/admin/results" className="nav-btn">النتائج والتقارير</Link>
          <button onClick={handleLogout} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSignOutAlt />
            خروج
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Header Title with quick Create Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800' }}>مرحباً بك في لوحة تحكم المسؤول 👋</h1>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>إحصائيات المنصة وأحدث الاختبارات النشطة</p>
          </div>
          <Link to="/admin/exams?action=create" className="btn btn-accent" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <FaPlus />
            إنشاء اختبار جديد
          </Link>
        </div>

        {/* Statistical Counters grid */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <FaClipboardList />
              </div>
              <div className="stat-info">
                <h3>إجمالي الاختبارات</h3>
                <p>{stats.total_exams}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <FaUserGraduate />
              </div>
              <div className="stat-info">
                <h3>عدد مشاركات الطلاب</h3>
                <p>{stats.total_submissions}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <FaChartBar />
              </div>
              <div className="stat-info">
                <h3>متوسط درجات الطلاب</h3>
                <p>{stats.average_percentage}%</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                ⚡
              </div>
              <div className="stat-info">
                <h3>اختبارات جارية الآن</h3>
                <p>{stats.active_exams_count}</p>
              </div>
            </div>
          </div>
        )}

        {/* Exams List Glass Card */}
        <div className="glass-card" style={{ padding: '25px' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #3b82f6', paddingRight: '10px' }}>
            جدول الاختبارات المتاحة
          </h2>

          {exams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted-dark)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>لا توجد أي اختبارات منشأة حالياً.</p>
              <Link to="/admin/exams?action=create" className="btn btn-primary">أنشئ أول اختبار الآن</Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>كود الاختبار</th>
                    <th>عنوان الاختبار</th>
                    <th>تاريخ ووقت البدء (UTC)</th>
                    <th>مدة الاختبار</th>
                    <th>الأسئلة</th>
                    <th>الدرجة الكلية</th>
                    <th style={{ textAlign: 'center' }}>العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(exam => {
                    const localStartStr = new Date(exam.start_time).toLocaleString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={exam.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '1px' }}>
                              {exam.exam_code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(exam.exam_code)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                              title="نسخ كود الاختبار"
                            >
                              <FaCopy />
                            </button>
                          </div>
                        </td>
                        <td><strong>{exam.title}</strong></td>
                        <td>{localStartStr}</td>
                        <td>{exam.duration_minutes} دقيقة</td>
                        <td>{exam.total_questions} أسئلة</td>
                        <td>{exam.total_marks} درجة</td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <Link to={`/admin/results?exam_id=${exam.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                              النتائج
                            </Link>
                            <a 
                              href={apiService.getExportUrl(exam.id)}
                              className="btn"
                              style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#10b981', color: 'white' }}
                              title="تحميل شيت إكسيل"
                            >
                              <FaFileExcel />
                            </a>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                              title="حذف الاختبار"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default AdminDashboard;
