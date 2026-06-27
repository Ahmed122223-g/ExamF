import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaUser, FaClock, FaClipboardList, FaArrowRight, FaExclamationCircle, FaLock, FaCheckCircle, FaTimes, FaCheck, FaSync } from 'react-icons/fa';
import Swal from 'sweetalert2';

const RegisterStudent = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [exam, setExam] = useState(location.state?.exam || null);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  // Countdown to start states
  const [timeLeftToStart, setTimeLeftToStart] = useState(0);

  // Post-exam submission states
  const [result, setResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [checkingDetails, setCheckingDetails] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);

  const studentToken = sessionStorage.getItem(`student_token_${examId}`);
  const storedName = sessionStorage.getItem(`student_name_${examId}`);

  // 1. Fetch exam details and check if already submitted
  const fetchExamAndResult = async () => {
    try {
      // Verify exam code/id
      const examData = await apiService.verifyExam(examId);
      setExam(examData);
      
      // Calculate remaining seconds to start
      setTimeLeftToStart(examData.starts_in_seconds);

      // If student has a token, check if they have a submitted result
      if (studentToken) {
        try {
          const resData = await apiService.getExamResult(examId, studentToken);
          setResult(resData);
          setIsSubmitted(true);
        } catch (resErr) {
          // No result found yet, which means they registered but haven't submitted yet
          setIsSubmitted(false);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل في تحميل تفاصيل الاختبار.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamAndResult();
  }, [examId, studentToken]);

  // 2. Countdown Timer until Exam Starts
  useEffect(() => {
    if (timeLeftToStart <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftToStart(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Unlock exam
          setExam(old => old ? { ...old, is_active: true } : null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftToStart]);

  // 3. Register Student for the Exam
  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const mainToken = localStorage.getItem('student_token');
    if (!mainToken) {
      Swal.fire('تنبيه!', 'يرجى تسجيل الدخول لحساب الطالب أولاً.', 'warning');
      navigate('/login');
      return;
    }

    setRegistering(true);
    try {
      // API call registerStudent takes (examId, mainToken)
      const data = await apiService.registerStudent(examId, mainToken);
      
      // Store session token generated specifically for this exam taking session
      sessionStorage.setItem(`student_token_${examId}`, data.access_token);
      sessionStorage.setItem(`student_name_${examId}`, data.student_name || 'طالب');
      
      navigate(`/take-exam/${examId}`);
    } catch (err) {
      Swal.fire('خطأ!', err.response?.data?.detail || 'فشل في الدخول للاختبار.', 'error');
      setRegistering(false);
    }
  };

  // 4. Refresh Detailed correction state
  const handleRefreshResult = async () => {
    if (!studentToken) return;
    setCheckingDetails(true);
    try {
      const data = await apiService.getExamResult(examId, studentToken);
      setResult(data);
      if (data.is_exam_ended) {
        Swal.fire('تم تحديث البيانات!', 'انتهى وقت الاختبار الرسمي وتم فتح الإجابات النموذجية والتصحيح التفصيلي.', 'success');
      } else {
        Swal.fire('الاختبار مستمر', 'لم ينتهِ الوقت الرسمي للاختبار بعد للجميع. يرجى الانتظار وتحديث الصفحة لاحقاً.', 'info');
      }
    } catch (err) {
      Swal.fire('خطأ!', 'فشل في تحديث بيانات النتيجة.', 'error');
    } finally {
      setCheckingDetails(false);
    }
  };

  const handleExit = () => {
    sessionStorage.removeItem(`student_token_${examId}`);
    sessionStorage.removeItem(`student_name_${examId}`);
    navigate('/');
  };

  const formatCountdown = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
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
          <h2 style={{ marginBottom: '10px' }}>حدث خطأ</h2>
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
      padding: '40px 20px',
      background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)'
    }}>
      <div className="glass-card" style={{ maxWidth: showCorrections ? '850px' : '580px', width: '100%', position: 'relative', transition: 'max-width 0.3s ease' }}>
        
        {/* Back Button */}
        {!isSubmitted && (
          <button onClick={() => navigate('/')} style={{
            position: 'absolute', top: '20px', left: '20px',
            background: 'none', border: 'none', color: 'var(--text-muted-dark)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem'
          }}>
            الرجوع
            <FaArrowRight />
          </button>
        )}

        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '20px', color: 'white', borderBottom: '1px solid var(--border-dark)', paddingBottom: '15px', marginTop: '20px' }}>
          قاعة بوابة الاختبار
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
            <h3 style={{ color: 'var(--accent-color)', fontSize: '1.15rem', fontWeight: 'bold', margin: 0 }}>{exam.title}</h3>
            
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

        {isSubmitted && result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', textAlign: 'center' }}>
            
            {/* Header Result status */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              {result.is_submitted === false ? (
                <div style={{ fontSize: '4rem', color: '#ef4444' }}>⚠️</div>
              ) : result.is_cheated ? (
                <div style={{ fontSize: '4rem', color: '#ef4444' }}>⚠️</div>
              ) : (
                <FaCheckCircle style={{ fontSize: '4rem', color: '#10b981' }} />
              )}
              <h3 style={{ fontSize: '1.4rem', color: 'white', fontWeight: 'bold' }}>
                {result.is_submitted === false ? 'انتهى الوقت ولم تقم بتسليم الإجابات (تم احتساب درجة 0)' : (result.is_cheated ? 'تم إنهاء الاختبار ورصد محاولة مخالفة' : 'تم تسليم إجاباتك بنجاح!')}
              </h3>
              <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', margin: 0 }}>
                اسم الطالب: <strong>{storedName || result.student_name}</strong>
              </p>
            </div>

            {/* Score block */}
            <div style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid var(--border-dark)',
              borderRadius: '16px',
              padding: '20px 40px',
              margin: '0 auto',
              width: 'fit-content'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted-dark)' }}>الدرجة الحاصل عليها</span>
              <span style={{ fontSize: '2.5rem', fontWeight: '900', color: result.status === 'ناجح' ? '#10b981' : '#ef4444' }}>
                {result.score} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted-dark)', fontWeight: 'normal' }}>/ {result.total_marks}</span>
              </span>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '50px',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                backgroundColor: result.status === 'ناجح' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: result.status === 'ناجح' ? '#10b981' : '#ef4444',
                marginTop: '8px'
              }}>
                التقدير: {result.grade}
              </span>
            </div>

            {/* Exit/Refresh Action Panel */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleExit} className="btn btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                خروج من القاعة
              </button>
              
              {!result.is_exam_ended && (
                <button onClick={handleRefreshResult} disabled={checkingDetails} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <FaSync className={checkingDetails ? 'spin-anim' : ''} />
                  {checkingDetails ? 'جاري التحديث...' : 'تحديث وتدقيق التصحيح'}
                </button>
              )}

              {result.is_exam_ended && (
                <button 
                  onClick={() => setShowCorrections(prev => !prev)} 
                  className="btn btn-accent" 
                  style={{ fontWeight: 'bold' }}
                >
                  {showCorrections ? 'إخفاء ورقة التصحيح' : 'عرض ورقة التصحيح التفصيلية'}
                </button>
              )}
            </div>

            {/* Lock Message if Exam NOT ended yet */}
            {!result.is_exam_ended && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                marginTop: '10px'
              }}>
                <FaLock style={{ fontSize: '1.8rem', color: '#f59e0b', marginBottom: '10px' }} />
                <h4 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '5px' }}>التصحيح التفصيلي مقفل مؤقتاً</h4>
                <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.8rem', margin: 0 }}>
                  الإجابات النموذجية وتصحيح الأسئلة سيتم تفعيلها للجميع فور انتهاء وقت الاختبار بالكامل لمنع تسريب الإجابات. يرجى الرجوع لاحقاً.
                </p>
              </div>
            )}

            {/* Detailed Corrections Block Inline */}
            {showCorrections && result.is_exam_ended && (
              <div style={{ marginTop: '30px', textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #3b82f6', paddingRight: '12px' }}>
                  التصحيح التفصيلي لإجاباتك
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {result.questions.map((q, idx) => {
                    const isCorrect = q.is_correct;
                    const isSkipped = q.selected_answer === null;

                    return (
                      <div key={q.id} style={{
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-dark)',
                        background: isSkipped ? 'rgba(30, 41, 59, 0.2)' : (isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)'),
                        borderColor: isSkipped ? 'var(--border-dark)' : (isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <span style={{
                              backgroundColor: '#3b82f6', color: 'white',
                              width: '24px', height: '24px', borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0
                            }}>
                              {idx + 1}
                            </span>
                            <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem', lineHeight: '1.6' }}>{q.question_text}</h4>
                          </div>
                          
                          <span style={{
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                            backgroundColor: isSkipped ? '#334155' : (isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                            color: isSkipped ? '#94a3b8' : (isCorrect ? '#10b981' : '#ef4444')
                          }}>
                            {isSkipped ? 'غير مجاب' : (isCorrect ? `+${q.marks} درجة` : '0 درجة')}
                          </span>
                        </div>

                        <div className="responsive-grid-choices" style={{ paddingRight: '15px' }}>
                          {['a', 'b', 'c', 'd'].map(optKey => {
                            const optText = q[`option_${optKey}`];
                            const isStudentSel = q.selected_answer === optKey;
                            const isCorrectAns = q.correct_answer === optKey;

                            let borderCol = 'var(--border-dark)';
                            let bgCol = 'transparent';
                            let icon = null;

                            if (isCorrectAns) {
                              borderCol = '#10b981';
                              bgCol = 'rgba(16, 185, 129, 0.1)';
                              icon = <FaCheck style={{ color: '#10b981', fontSize: '0.8rem' }} />;
                            } else if (isStudentSel && !isCorrectAns) {
                              borderCol = '#ef4444';
                              bgCol = 'rgba(239, 68, 68, 0.1)';
                              icon = <FaTimes style={{ color: '#ef4444', fontSize: '0.8rem' }} />;
                            }

                            return (
                              <div key={optKey} style={{
                                padding: '8px 12px', border: `1px solid ${borderCol}`,
                                backgroundColor: bgCol, borderRadius: '8px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                fontSize: '0.85rem'
                              }}>
                                <span style={{ color: isStudentSel ? 'white' : 'var(--text-muted-dark)' }}>
                                  <strong>({optKey.toUpperCase()})</strong> {optText}
                                </span>
                                {icon}
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
                            fontSize: '0.85rem',
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
            )}

          </div>
        ) : (
          /* CASE 2: Exam not started yet (LOCKED COUNTDOWN) */
          timeLeftToStart > 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', margin: '0 auto 15px', border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <FaLock />
              </div>
              
              <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
                الاختبار لم يبدأ بعد
              </h3>
              <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginBottom: '25px' }}>
                سيفتح هذا الاختبار تلقائياً بعد انتهاء العد التنازلي أدناه. يرجى عدم مغادرة الصفحة.
              </p>

              {/* Countdown Timer Display */}
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-dark)',
                borderRadius: '12px',
                padding: '15px 30px',
                display: 'inline-block',
                fontSize: '2rem',
                fontWeight: '900',
                letterSpacing: '2px',
                color: '#f59e0b',
                fontFamily: 'Tajawal'
              }}>
                {formatCountdown(timeLeftToStart)}
              </div>
            </div>
          ) : (
            /* CASE 3: Exam is Active and Ready to Start */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '12px',
                padding: '20px',
                color: '#e2e8f0',
                fontSize: '0.92rem',
                lineHeight: '1.8'
              }}>
                <h4 style={{ color: '#60a5fa', fontWeight: '800', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📋 تعليمات وقوانين الاختبار الهامة:
                </h4>
                <ul style={{ paddingRight: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li>🚫 <strong>منع الغش والالتفاف:</strong> يُمنع تماماً الخروج من وضع ملء الشاشة، أو الانتقال لتبويبات أخرى، أو تصغير المتصفح.</li>
                  <li>⚠️ <strong>الإرسال التلقائي:</strong> في حال استشعار أي محاولة للخروج من الصفحة، سيقوم النظام فوراً بإغلاق الامتحان وحفظ إجاباتك ورصد محاولة مخالفة وإبلاغ الأدمن.</li>
                  <li>⏱️ <strong>مؤقت الامتحان:</strong> يبدأ المؤقت التنازلي للامتحان فور ضغطك على زر الدخول، ولن يتوقف المؤقت حتى لو قمت بتحديث الصفحة أو إغلاقها.</li>
                  <li>💾 <strong>حفظ الإجابات:</strong> يمكنك تعديل إجاباتك في أي وقت خلال الامتحان قبل انتهاء الوقت المخصص أو ضغط زر تسليم الإجابة.</li>
                </ul>
              </div>

              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                padding: '16px',
                color: '#f87171',
                fontSize: '0.88rem',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>⚠️</span>
                <span>بضغطك على زر الدخول أدناه، فإنك تقر بقراءة التعليمات الأمنية أعلاه وتتحمل مسؤولية أي خروج مفاجئ عن نافذة الامتحان الذي قد يؤدي إلى إنهاء وتقديم ورقتك تلقائياً.</span>
              </div>

              <button
                onClick={handleRegister}
                className="btn btn-accent"
                disabled={registering}
                style={{ padding: '14px', fontSize: '1.1rem', marginTop: '10px', fontWeight: '800' }}
              >
                {registering ? 'جاري تهيئة الامتحان...' : 'موافق، ادخل إلى الامتحان الآن 🚀'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RegisterStudent;
