import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaSignOutAlt, FaPlus, FaSearch, FaClipboardList, FaCheckCircle, FaExclamationTriangle, FaLock, FaCalendarAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const StudentDashboard = () => {
  const [examCode, setExamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('student_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const data = await apiService.studentGetDashboard(token);
      setStudentData(data);
      setAttempts(data.attempts || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_name');
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل في تحميل بيانات لوحة التحكم'
        });
      }
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_name');
    Swal.fire({
      icon: 'success',
      title: 'تم تسجيل الخروج',
      timer: 1000,
      showConfirmButton: false
    });
    navigate('/login');
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    if (!examCode.trim()) return;

    setLoading(true);
    const token = localStorage.getItem('student_token');

    try {
      // 1. Verify exam code exists
      const exam = await apiService.verifyExam(examCode.trim());
      
      // 2. Register/Link the exam to this student's account
      await apiService.registerStudent(exam.id, token);
      
      Swal.fire({
        icon: 'success',
        title: 'تم إضافة الاختبار',
        text: `تم تسجيلك بنجاح في اختبار: ${exam.title}`,
        timer: 2000,
        showConfirmButton: false
      });
      
      setExamCode('');
      // Reload dashboard lists
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'عذراً',
        text: err.response?.data?.detail || 'كود الاختبار غير صحيح أو غير متاح حالياً.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnterExam = async (examId) => {
    const token = localStorage.getItem('student_token');
    try {
      const res = await apiService.registerStudent(examId, token);
      sessionStorage.setItem(`student_token_${examId}`, res.access_token);
      sessionStorage.setItem(`student_name_${examId}`, res.student_name);
      navigate(`/take-exam/${examId}`);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.response?.data?.detail || 'فشل في دخول الاختبار'
      });
    }
  };

  const handleReviewExam = (examId) => {
    const examToken = sessionStorage.getItem(`student_token_${examId}`);
    // If we have an exam-specific token in session, use it, otherwise use student token (backend supports both)
    const token = examToken || localStorage.getItem('student_token');
    sessionStorage.setItem(`student_token_${examId}`, token);
    navigate(`/register-student/${examId}`);
  };

  if (dashboardLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 15px', direction: 'rtl', color: 'white' }}>
      
      {/* Top Navbar */}
      <div className="glass-card" style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'normal', color: 'var(--text-muted-dark)' }}>
            مرحباً بك،
          </h2>
          <h1 style={{ fontSize: '1.6rem', margin: '5px 0 0 0', color: 'white', fontWeight: 'bold' }}>
            🎓 {studentData?.student_name}
          </h1>
        </div>
        <button 
          onClick={handleLogout} 
          className="btn btn-danger" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.95rem' }}
        >
          <FaSignOutAlt /> تسجيل الخروج
        </button>
      </div>

      {/* Add / Search Exam */}
      <div className="glass-card" style={{ padding: '25px', marginBottom: '35px' }}>
        <h2 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaPlus style={{ color: 'var(--accent-color)' }} /> تسجيل واكتشاف اختبار جديد
        </h2>
        <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginBottom: '20px' }}>
          أدخل كود الاختبار الموفر لك من قبل المسؤول لتسجيله وإضافته لقائمتك الخاصة.
        </p>

        <form onSubmit={handleAddExam} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              placeholder="مثال: MATH101"
              required
              disabled={loading}
              style={{ paddingRight: '40px', width: '100%', textTransform: 'uppercase' }}
            />
            <FaSearch style={{ position: 'absolute', top: '16px', right: '15px', color: 'var(--text-muted-dark)' }} />
          </div>
          <button 
            type="submit" 
            className="btn btn-accent" 
            disabled={loading || !examCode.trim()} 
            style={{ padding: '12px 25px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}
          >
            إضافة الاختبار
          </button>
        </form>
      </div>

      {/* Attempts / Registered Exams List */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaClipboardList /> اختباراتي المسجلة ({attempts.length})
        </h2>

        {attempts.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted-dark)' }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>لا توجد أي اختبارات مسجلة بحسابك حالياً.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>يرجى إدخال كود الاختبار في الأعلى للبدء.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {attempts.map((attempt) => {
              // Calculate status tags
              const hasEnded = new Date(attempt.end_time_utc) < new Date();
              
              return (
                <div 
                  key={attempt.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '22px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '20px',
                    borderRight: attempt.is_submitted ? '4px solid #10b981' : '4px solid #f59e0b'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                      {attempt.exam_title}
                    </h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted-dark)' }}>
                      <span>الكود: <strong>{attempt.exam_code}</strong></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaCalendarAlt /> تاريخ الانتهاء: {new Date(attempt.end_time_utc).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Status & Scores */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      {attempt.is_submitted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <FaCheckCircle /> تم التسليم
                          </span>
                          <span style={{ fontSize: '0.95rem', color: 'white', fontWeight: 'bold', marginTop: '3px' }}>
                            الدرجة: <span style={{ color: attempt.status === 'ناجح' ? '#10b981' : '#ef4444' }}>{attempt.score}</span> / {attempt.total_marks}
                          </span>
                        </div>
                      ) : hasEnded ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                          <FaExclamationTriangle /> انتهى الوقت ولم يسلم
                        </span>
                      ) : (
                        <span className="pulse-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                          🟢 جاهز للدخول
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div>
                      {attempt.is_submitted ? (
                        attempt.review_allowed ? (
                          <button 
                            onClick={() => handleReviewExam(attempt.exam_id)}
                            className="btn btn-primary"
                            style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: '#10b981', color: 'white', border: 'none', cursor: 'pointer' }}
                          >
                            مراجعة التصحيح
                          </button>
                        ) : (
                          <button 
                            disabled 
                            className="btn" 
                            style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: '#334155', color: '#94a3b8', border: 'none', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '5px' }}
                            title="يتاح المراجعة بعد انتهاء وقت الاختبار بالكامل للجميع"
                          >
                            <FaLock /> المراجعة مغلقة
                          </button>
                        )
                      ) : hasEnded ? (
                        <button 
                          disabled 
                          className="btn" 
                          style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: '#1e293b', color: '#64748b', border: 'none', cursor: 'not-allowed' }}
                        >
                          انتهى الاختبار
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEnterExam(attempt.exam_id)}
                          className="btn btn-accent"
                          style={{ padding: '8px 22px', fontSize: '0.85rem', fontWeight: 'bold' }}
                        >
                          دخول الاختبار
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default StudentDashboard;
