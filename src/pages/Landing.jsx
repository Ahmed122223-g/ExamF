import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaFileSignature, FaShieldAlt, FaClock, FaLock, FaCheckCircle, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Landing = () => {
  const [examCode, setExamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load searched exams from localStorage
  const [searchedExams, setSearchedExams] = useState(() => {
    try {
      const saved = localStorage.getItem('searched_exams');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [examStatuses, setExamStatuses] = useState({});
  const [timeLefts, setTimeLefts] = useState({});

  // Sync / check statuses when list of searched exams changes
  useEffect(() => {
    const checkAllStatuses = async () => {
      const statuses = {};
      const initialTimeLefts = {};

      for (const exam of searchedExams) {
        // Calculate initial starts_in_seconds
        const start = new Date(exam.start_time).getTime();
        const diff = Math.max(0, Math.floor((start - Date.now()) / 1000));
        initialTimeLefts[exam.id] = diff;

        const token = sessionStorage.getItem(`student_token_${exam.id}`);
        if (token) {
          try {
            const res = await apiService.getExamResult(exam.id, token);
            statuses[exam.id] = { isSubmitted: true, result: res };
          } catch (err) {
            statuses[exam.id] = { isSubmitted: false, result: null };
          }
        } else {
          statuses[exam.id] = { isSubmitted: false, result: null };
        }
      }

      setExamStatuses(statuses);
      setTimeLefts(initialTimeLefts);
    };

    if (searchedExams.length > 0) {
      checkAllStatuses();
    }
  }, [searchedExams]);

  // Countdown timer ticking
  useEffect(() => {
    if (Object.keys(timeLefts).length === 0) return;

    const timer = setInterval(() => {
      setTimeLefts(prev => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach(id => {
          if (next[id] > 0) {
            next[id] = next[id] - 1;
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLefts]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!examCode.trim()) return;

    setLoading(true);
    try {
      const data = await apiService.verifyExam(examCode.trim());
      
      const exists = searchedExams.some(item => item.id === data.id);
      let updatedExams = [...searchedExams];
      if (!exists) {
        const examItem = {
          id: data.id,
          exam_code: data.exam_code,
          title: data.title,
          duration_minutes: data.duration_minutes,
          start_time: data.start_time,
          end_time: data.end_time,
          total_questions: data.total_questions,
          total_marks: data.total_marks
        };
        updatedExams = [examItem, ...searchedExams];
        setSearchedExams(updatedExams);
        localStorage.setItem('searched_exams', JSON.stringify(updatedExams));

        Swal.fire({
          title: 'تم العثور على الاختبار!',
          text: `تمت إضافة اختبار "${data.title}" إلى قائمة اختباراتك بنجاح.`,
          icon: 'success',
          confirmButtonText: 'حسناً'
        });
      } else {
        Swal.fire({
          title: 'تنبيه!',
          text: 'هذا الاختبار موجود بالفعل في قائمتك أدناه.',
          icon: 'info',
          confirmButtonText: 'حسناً'
        });
      }
      setExamCode('');
    } catch (err) {
      Swal.fire({
        title: 'خطأ!',
        text: err.response?.data?.detail || 'فشل في العثور على هذا الاختبار. يرجى التحقق من الكود.',
        icon: 'error',
        confirmButtonText: 'حسناً'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = (examId, e) => {
    e.stopPropagation();
    Swal.fire({
      title: 'هل تريد حذف هذا الاختبار؟',
      text: 'سيتم إزالته من قائمتك المحلية ويمكنك البحث عنه مجدداً.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155'
    }).then((res) => {
      if (res.isConfirmed) {
        const updated = searchedExams.filter(item => item.id !== examId);
        setSearchedExams(updated);
        localStorage.setItem('searched_exams', JSON.stringify(updated));
      }
    });
  };

  const formatCountdown = (seconds) => {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: '40px 20px',
      background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)'
    }}>

      {/* Search Exam Card */}
      <div className="glass-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', position: 'relative', marginBottom: '30px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 24px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          📝
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-dark)', marginBottom: '10px' }}>
          منصة الاختبارات <span>الإلكترونية</span>
        </h1>
        <p style={{ color: 'var(--text-muted-dark)', marginBottom: '35px', fontSize: '1rem', lineHeight: '1.7' }}>
          يرجى إدخال كود أو معرّف الاختبار الموفر لك من قبل المسؤول للبحث عنه وإضافته لقائمتك.
        </p>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ textAlign: 'right' }}>
            <label className="form-label" style={{ fontSize: '1rem', fontWeight: 'bold' }}>كود / معرّف الاختبار</label>
            <input
              type="text"
              className="form-input"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              placeholder="مثال: MATH101"
              required
              disabled={loading}
              style={{ padding: '15px 20px', fontSize: '1.1rem', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={loading || !examCode.trim()}
            style={{ padding: '15px', fontSize: '1.1rem', marginTop: '10px' }}
          >
            {loading ? 'جاري البحث والتحقق...' : 'البحث عن الاختبار'}
          </button>
        </form>

        <div style={{ 
          marginTop: '40px', 
          paddingTop: '25px', 
          borderTop: '1px solid var(--border-dark)', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '15px' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <FaShieldAlt style={{ color: '#10b981', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)' }}>بيئة محمية وآمنة</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <FaClock style={{ color: '#f59e0b', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)' }}>مؤقت زمني دقيق</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <FaFileSignature style={{ color: '#3b82f6', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)' }}>تصحيح فوري للنتيجة</span>
          </div>
        </div>
      </div>

      {/* Searched Exams List Section */}
      {searchedExams.length > 0 && (
        <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '25px', textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '20px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📂 قائمة اختباراتك</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)', fontWeight: 'normal' }}>({searchedExams.length})</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {searchedExams.map(exam => {
              const statusInfo = examStatuses[exam.id] || { isSubmitted: false, result: null };
              const timeLeft = timeLefts[exam.id] ?? 0;
              const isStarted = timeLeft <= 0;
              
              // Calculate if official exam time has passed (start_time + duration or end_time)
              const startMs = new Date(exam.start_time).getTime();
              const endMs = exam.end_time ? new Date(exam.end_time).getTime() : startMs + (exam.duration_minutes * 60 * 1000);
              const hasEnded = endMs < Date.now();
              
              return (
                <div key={exam.id} style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.3)',
                  border: '1px solid var(--border-dark)',
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => handleDeleteExam(exam.id, e)} 
                    style={{
                      position: 'absolute',
                      top: '15px',
                      left: '15px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger-color)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      opacity: 0.6,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 1}
                    onMouseLeave={(e) => e.target.style.opacity = 0.6}
                    title="حذف من القائمة"
                  >
                    <FaTrash />
                  </button>

                  <div>
                    <h3 style={{ color: 'var(--accent-color)', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 5px 0', paddingLeft: '25px' }}>
                      {exam.title}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted-dark)', marginBottom: '5px' }}>
                      <span>كود الاختبار: <strong>{exam.exam_code}</strong></span>
                      <span>البدء: {new Date(exam.start_time).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {exam.end_time && <span>الانتهاء: {new Date(exam.end_time).toLocaleString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr', 
                    gap: '10px', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-muted-dark)', 
                    borderTop: '1px solid rgba(255,255,255,0.05)', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    padding: '10px 0' 
                  }}>
                    <div>⏱️ المدة: <strong>{exam.duration_minutes} دقيقة</strong></div>
                    <div>❓ الأسئلة: <strong>{exam.total_questions}</strong></div>
                    <div>⭐ الدرجة: <strong>{exam.total_marks}</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    {/* Status badge */}
                    <div>
                      {statusInfo.isSubmitted ? (
                        statusInfo.result?.is_submitted === false ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            <FaExclamationTriangle /> لم يتم تسليم الإجابات
                          </span>
                        ) : statusInfo.result?.is_cheated ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            <FaExclamationTriangle /> تم رصد مخالفة غش
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <FaCheckCircle /> تم التسليم
                          </span>
                        )
                      ) : !isStarted ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                          ⏳ لم يبدأ بعد
                        </span>
                      ) : hasEnded ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                          🚫 انتهى وقت الاختبار
                        </span>
                      ) : (
                        <span className="pulse-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                          🟢 متاح حالياً
                        </span>
                      )}
                    </div>

                    {/* Action button */}
                    <div>
                      {statusInfo.isSubmitted ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {statusInfo.result && (
                            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 'bold' }}>
                              الدرجة: <span style={{ color: statusInfo.result.status === 'ناجح' ? '#10b981' : '#ef4444' }}>{statusInfo.result.score}</span> / {statusInfo.result.total_marks}
                            </span>
                          )}
                          <button 
                            onClick={() => navigate(`/register-student/${exam.id}`)}
                            className="btn"
                            style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                          >
                            مراجعة التصحيح
                          </button>
                        </div>
                      ) : !isStarted ? (
                        <button 
                          disabled 
                          className="btn" 
                          style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#334155', color: '#94a3b8', borderRadius: '8px', border: 'none', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <FaLock />
                          يبدأ خلال {formatCountdown(timeLeft)}
                        </button>
                      ) : hasEnded ? (
                        <button 
                          disabled 
                          className="btn" 
                          style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#1e293b', color: '#64748b', borderRadius: '8px', border: 'none', cursor: 'not-allowed' }}
                        >
                          انتهى الاختبار
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate(`/register-student/${exam.id}`)}
                          className="btn btn-accent"
                          style={{ padding: '8px 20px', fontSize: '0.85rem', borderRadius: '8px' }}
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
        </div>
      )}
    </div>
  );
};

export default Landing;
