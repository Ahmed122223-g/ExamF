import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaUser, FaClock, FaClipboardList, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

const RegisterStudent = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState(location.state?.exam || null);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(!exam);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!exam) {
      const fetchExamDetails = async () => {
        try {
          const data = await apiService.verifyExam(examId);
          setExam(data);
        } catch (err) {
          setError(err.response?.data?.detail || 'فشل في تحميل تفاصيل الاختبار.');
        } finally {
          setLoading(false);
        }
      };
      fetchExamDetails();
    }
  }, [examId, exam]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const name = studentName.trim();
    if (!name) return;

    // Check if the student input at least three words (full name)
    const words = name.split(/\s+/);
    if (words.length < 3) {
      Swal.fire('تنبيه!', 'يرجى إدخال اسمك ثلاثياً على الأقل لضمان تسجيل النتيجة باسمك الصحيح.', 'warning');
      return;
    }

    setRegistering(true);
    try {
      const data = await apiService.registerStudent(examId, name);
      
      // Save details to sessionStorage
      sessionStorage.setItem(`student_token_${examId}`, data.access_token);
      sessionStorage.setItem(`student_name_${examId}`, name);
      
      Swal.fire({
        title: 'جاهز لبدء الاختبار؟',
        text: 'بمجرد الضغط على زر الدخول، سيتم رصد أي محاولة للخروج من الصفحة أو تقسيم الشاشة وسيتم تسليم اختبارك تلقائياً.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'نعم، ابدأ الاختبار',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#3b82f6',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(`/take-exam/${examId}`);
        } else {
          setRegistering(false);
        }
      });

    } catch (err) {
      Swal.fire('خطأ!', err.response?.data?.detail || 'فشل في التسجيل للاختبار. قد تكون مسجلاً مسبقاً.', 'error');
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#090d16' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', background: '#090d16' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <FaExclamationCircle style={{ fontSize: '3.5rem', color: 'var(--danger-color)', marginBottom: '15px' }} />
          <h2 style={{ marginBottom: '10px' }}>عذراً، حدث خطأ</h2>
          <p style={{ color: 'var(--text-muted-dark)', marginBottom: '25px' }}>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ width: '100%' }}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)'
    }}>
      <div className="glass-card" style={{ maxWidth: '550px', width: '100%', position: 'relative' }}>
        
        {/* Back button */}
        <button onClick={() => navigate('/')} style={{
          position: 'absolute', top: '20px', left: '20px',
          background: 'none', border: 'none', color: 'var(--text-muted-dark)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem'
        }}>
          الرجوع
          <FaArrowRight />
        </button>

        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '20px', color: 'var(--text-dark)', borderBottom: '1px solid var(--border-dark)', paddingBottom: '15px', marginTop: '20px' }}>
          بيانات دخول الاختبار
        </h2>

        {exam && (
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            borderRadius: '10px',
            padding: '15px 20px',
            marginBottom: '25px',
            border: '1px solid var(--border-dark)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ color: 'var(--accent-color)', fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{exam.title}</h3>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted-dark)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaClock style={{ color: '#3b82f6' }} />
                <span>المدة: <strong>{exam.duration_minutes} دقيقة</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaClipboardList style={{ color: '#10b981' }} />
                <span>الأسئلة: <strong>{exam.total_questions} أسئلة</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⭐
                <span>الدرجة الكلية: <strong>{exam.total_marks} درجة</strong></span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaUser style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }} />
              اسم الطالب الثلاثي بالكامل
            </label>
            <input
              type="text"
              className="form-input"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="اكتب اسمك كاملاً..."
              required
              disabled={registering}
              style={{ fontSize: '1.05rem', padding: '12px 16px' }}
            />
          </div>

          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '12px 15px',
            color: '#f87171',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.1rem', marginTop: '-2px' }}>⚠️</span>
            <span>تنبيه أمني هام: يجب عدم إغلاق نافذة الامتحان، أو التحويل لتبويب آخر، أو تصغير النافذة، وإلا سيقوم النظام بإنهاء امتحانك وحفظ إجاباتك الحالية تلقائياً مع رصد المخالفة للأدمن.</span>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={registering || !studentName.trim()}
            style={{ padding: '14px', fontSize: '1.1rem', marginTop: '10px' }}
          >
            {registering ? 'جاري الدخول...' : 'تسجيل الاسم وبدء الاختبار'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterStudent;
