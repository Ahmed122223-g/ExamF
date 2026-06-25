import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaCheckCircle, FaExclamationCircle, FaLock, FaClock, FaCheck, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ExamResult = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingDetails, setCheckingDetails] = useState(false);

  const studentToken = sessionStorage.getItem(`student_token_${examId}`);
  const studentName = sessionStorage.getItem(`student_name_${examId}`);

  useEffect(() => {
    if (!studentToken) {
      setError('غير مصرح لك باستعراض النتيجة. يرجى أداء الاختبار أولاً.');
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const data = await apiService.getExamResult(examId, studentToken);
        setResult(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'فشل في تحميل تفاصيل النتيجة.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [examId, studentToken]);

  const handleRefreshDetails = async () => {
    setCheckingDetails(true);
    try {
      const data = await apiService.getExamResult(examId, studentToken);
      setResult(data);
      if (data.is_exam_ended) {
        Swal.fire('تم التحديث!', 'وقت الاختبار انتهى وتم إظهار تفاصيل الإجابات الصحيحة والتصحيح الآن.', 'success');
      } else {
        Swal.fire('لم ينتهِ الوقت بعد', 'الاختبار لا يزال جارياً لطلاب آخرين، ستفتح التفاصيل بمجرد انتهاء الوقت الرسمي.', 'info');
      }
    } catch (err) {
      Swal.fire('خطأ!', 'فشل في تحديث بيانات التصحيح.', 'error');
    } finally {
      setCheckingDetails(false);
    }
  };

  const handleExit = () => {
    // Clear student tokens
    sessionStorage.removeItem(`student_token_${examId}`);
    sessionStorage.removeItem(`student_name_${examId}`);
    sessionStorage.removeItem(`exam_result_${examId}`);
    navigate('/');
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', background: '#090d16', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
          <FaExclamationCircle style={{ fontSize: '3.5rem', color: 'var(--danger-color)', marginBottom: '15px' }} />
          <h2 style={{ marginBottom: '10px' }}>خطأ في النتيجة</h2>
          <p style={{ color: 'var(--text-muted-dark)', marginBottom: '25px' }}>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ width: '100%' }}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const scorePercentage = result ? (result.score / result.total_marks * 100) : 0;
  const isPassed = result ? result.status === 'ناجح' : false;

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', padding: '40px 15px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Main Result Card */}
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            {result.is_cheated ? (
              <div style={{ fontSize: '4.5rem', color: '#ef4444' }}>⚠️</div>
            ) : (
              <FaCheckCircle style={{ fontSize: '4.5rem', color: '#10b981' }} />
            )}
          </div>

          <h1 style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800', marginBottom: '10px' }}>
            {result.is_cheated ? 'تم إنهاء الاختبار ورصد خروج' : 'تم تسليم الاختبار بنجاح'}
          </h1>
          <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.95rem', marginBottom: '30px' }}>
            مرحباً <strong>{studentName}</strong>، لقد تم حفظ إجاباتك للاختبار <strong>{result.exam_title}</strong>.
          </p>

          {/* Scores Display */}
          <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid var(--border-dark)',
            borderRadius: '20px',
            padding: '25px 45px',
            marginBottom: '30px'
          }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted-dark)', fontWeight: 'bold' }}>الدرجة النهائية</span>
            <span style={{ fontSize: '3rem', fontWeight: '900', color: isPassed ? '#10b981' : '#ef4444' }}>
              {result.score} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted-dark)', fontWeight: 'normal' }}>/ {result.total_marks}</span>
            </span>
            <span style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: '50px',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isPassed ? '#10b981' : '#ef4444',
              marginTop: '10px'
            }}>
              التقدير: {result.grade} ({scorePercentage.toFixed(1)}%)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={handleExit} className="btn btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <FaSignOutAlt />
              خروج من الجلسة
            </button>
            
            {!result.is_exam_ended && (
              <button onClick={handleRefreshDetails} disabled={checkingDetails} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FaClock />
                {checkingDetails ? 'جاري التحقق...' : 'تحديث وتدقيق التصحيح'}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Grading Details Section */}
        {result.is_exam_ended ? (
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #3b82f6', paddingRight: '12px' }}>
              التصحيح التفصيلي للإجابات
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {result.questions.map((q, idx) => {
                const isCorrect = q.is_correct;
                const isSkipped = q.selected_answer === null;

                return (
                  <div key={q.id} className="glass-card" style={{
                    padding: '24px',
                    borderColor: isSkipped ? 'var(--border-dark)' : (isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'),
                    background: isSkipped ? 'var(--glass-bg)' : (isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)')
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          flexShrink: 0,
                          fontSize: '0.85rem'
                        }}>
                          {idx + 1}
                        </span>
                        <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', lineHeight: '1.6' }}>{q.question_text}</h4>
                      </div>

                      {/* Marks / Status badge */}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: isSkipped ? '#334155' : (isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                        color: isSkipped ? '#94a3b8' : (isCorrect ? '#10b981' : '#ef4444')
                      }}>
                        {isSkipped ? 'لم تجب' : (isCorrect ? `+${q.marks} درجة` : '0 درجة')}
                      </span>
                    </div>

                    {/* Show option list with grading highlights */}
                    <div className="responsive-grid-choices" style={{ paddingRight: '15px' }}>
                      {['a', 'b', 'c', 'd'].map(optKey => {
                        const optText = q[`option_${optKey}`];
                        const isStudentSel = q.selected_answer === optKey;
                        const isCorrectAns = q.correct_answer === optKey;

                        let borderCol = 'var(--border-dark)';
                        let bgCol = 'transparent';
                        let badgeIcon = null;

                        if (isCorrectAns) {
                          borderCol = '#10b981';
                          bgCol = 'rgba(16, 185, 129, 0.1)';
                          badgeIcon = <FaCheck style={{ color: '#10b981', fontSize: '0.85rem' }} />;
                        } else if (isStudentSel && !isCorrectAns) {
                          borderCol = '#ef4444';
                          bgCol = 'rgba(239, 68, 68, 0.1)';
                          badgeIcon = <FaTimes style={{ color: '#ef4444', fontSize: '0.85rem' }} />;
                        }

                        return (
                          <div key={optKey} style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${borderCol}`,
                            backgroundColor: bgCol,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.9rem'
                          }}>
                            <span style={{ color: isStudentSel ? 'white' : 'var(--text-muted-dark)' }}>
                              <strong>({optKey.toUpperCase()})</strong> {optText}
                            </span>
                            {badgeIcon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation if available */}
                    {q.explanation && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.06)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        fontSize: '0.88rem',
                        color: '#93c5fd',
                        lineHeight: '1.7',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>💡</span>
                        <span><strong style={{ color: '#60a5fa' }}>شرح الإجابة:</strong> {q.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Lock screen banner */
          <div className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '35px 30px',
            borderColor: 'rgba(245, 158, 11, 0.25)',
            background: 'rgba(245, 158, 11, 0.02)'
          }}>
            <FaLock style={{ fontSize: '2.5rem', color: '#f59e0b', marginBottom: '15px' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '8px' }}>تفاصيل الإجابات والتصحيح مغلقة</h3>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: '1.6' }}>
              لحماية سرية الاختبار ومنع مشاركة الإجابات النموذجية، سيتم تفعيل ميزة مراجعة الأسئلة وتصحيح الأخطاء لجميع الطلاب تلقائياً بمجرد انتهاء الوقت الرسمي للاختبار بالكامل.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExamResult;
