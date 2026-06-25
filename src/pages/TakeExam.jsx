import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Swal from 'sweetalert2';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [screenBlocked, setScreenBlocked] = useState(false);

  const answersRef = useRef(answers);
  const submittedRef = useRef(submitted);
  const submittingRef = useRef(submitting);

  const studentToken = sessionStorage.getItem(`student_token_${examId}`);
  const studentName = sessionStorage.getItem(`student_name_${examId}`);

  // Check split screen width
  const isScreenSplit = () => {
    const widthRatio = window.outerWidth / window.screen.availWidth;
    return widthRatio < 0.6;
  };

  // Sync state values to refs for callback access inside listeners
  useEffect(() => {
    answersRef.current = answers;
    submittedRef.current = submitted;
    submittingRef.current = submitting;
  }, [answers, submitted, submitting]);

  // Initial setup: auth checks and fetch exam
  useEffect(() => {
    if (!studentToken || !studentName) {
      setError('غير مصرح لك بدخول هذا المسار. يرجى إدخال اسمك أولاً.');
      setLoading(false);
      return;
    }

    if (isScreenSplit()) {
      setScreenBlocked(true);
      setLoading(false);
      return;
    }

    const fetchExam = async () => {
      try {
        // Sync server time to calculate exact time difference
        const timeRes = await axiosGetServerTime();
        const serverDate = new Date(timeRes.server_time).getTime();
        const localDate = Date.now();
        const offset = serverDate - localDate;
        setTimeOffset(offset);

        // Fetch exam questions
        const examData = await apiService.getExamData(examId, studentToken);
        setExam(examData);

        // Calculate exact remaining seconds until official exam end time
        const endTime = new Date(examData.end_time_utc).getTime();
        const now = Date.now() + offset;
        const diffSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeLeft(diffSeconds);
      } catch (err) {
        setError(err.response?.data?.detail || 'حدث خطأ أثناء تحميل الاختبار. قد يكون الوقت قد انتهى.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId, studentToken, studentName]);

  // Helper to fetch server time
  const axiosGetServerTime = async () => {
    const res = await apiService.verifyExam(examId); // endpoint returns time information too
    return { server_time: res.start_time }; // fallback server time sync
  };

  // Timer Countdown
  useEffect(() => {
    if (!exam || submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      const endTime = new Date(exam.end_time_utc).getTime();
      const now = Date.now() + timeOffset;
      const diffSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

      setTimeLeft(diffSeconds);

      if (diffSeconds <= 0) {
        clearInterval(timer);
        handleAutoSubmit(true); // timer expired
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, submitted, timeLeft, timeOffset]);

  // Anti-Cheat Event Listeners (Tab change, window blur, resize split)
  useEffect(() => {
    if (!exam || submittedRef.current) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && exam && !submittedRef.current && !submittingRef.current) {
        handleCheatingSubmit('تم اكتشاف خروجك من صفحة الاختبار (تغيير التبويب).');
      }
    };

    const handleBlur = () => {
      if (exam && !submittedRef.current && !submittingRef.current) {
        // Delay slightly to prevent triggering on dropdown select or text input blur in some browsers
        setTimeout(() => {
          if (document.activeElement && document.activeElement.tagName !== 'IFRAME') {
            if (!document.hasFocus() && !submittedRef.current && !submittingRef.current) {
              handleCheatingSubmit('تم اكتشاف خروجك من نافذة الاختبار أو إلغاء التركيز.');
            }
          }
        }, 300);
      }
    };

    const handleResize = () => {
      if (exam && !submittedRef.current && !submittingRef.current && isScreenSplit()) {
        handleCheatingSubmit('تم اكتشاف تقسيم الشاشة أو تصغير النافذة.');
      }
    };

    // Keyboard Shortcuts Blocker
    const handleKeyDown = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+S, Ctrl+P, F12, Ctrl+Shift+I
      if (
        (e.ctrlKey && ['c', 'v', 'u', 's', 'p', 'a', 'x'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'c', 'j'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        Swal.fire({
          title: 'إجراء محظور!',
          text: 'غير مسموح بنسخ النص، لصقه، طباعته أو استخدام أدوات المطورين أثناء الاختبار.',
          icon: 'warning',
          confirmButtonText: 'حسناً'
        });
      }
    };

    // Disable Right-Click
    const handleContextMenu = (e) => e.preventDefault();

    // Disable Copy/Paste
    const handleCopyCutPaste = (e) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
    };
  }, [exam]);

  const handleAutoSubmit = (timeExpired = false) => {
    if (!submittedRef.current && !submittingRef.current) {
      if (timeExpired) {
        Swal.fire({
          title: 'انتهى الوقت!',
          text: 'انتهى وقت الاختبار المحدد. سيتم تسليم إجاباتك الحالية تلقائياً.',
          icon: 'warning',
          timer: 3000,
          showConfirmButton: false
        }).then(() => {
          submitAnswers(false); // standard submit on timer end
        });
      }
    }
  };

  const handleCheatingSubmit = (reasonText) => {
    if (!submittedRef.current && !submittingRef.current) {
      setSubmitting(true);
      submittingRef.current = true;
      
      Swal.fire({
        title: 'تم إلغاء الاختبار!',
        text: `${reasonText} تم تسليم إجاباتك الحالية تلقائياً وتسجيل محاولة غش.`,
        icon: 'error',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#ef4444'
      }).then(() => {
        submitAnswers(true); // cheat submit
      });
    }
  };

  const submitAnswers = async (isCheated = false) => {
    setSubmitting(true);
    setSubmitted(true);
    submittedRef.current = true;

    // Format answers payload
    const answersPayload = exam.questions.map(q => ({
      question_id: q.id,
      selected_answer: answersRef.current[q.id] || null
    }));

    try {
      const res = await apiService.submitExam(examId, answersPayload, isCheated, studentToken);
      
      // Save result details in sessionStorage for the result screen
      sessionStorage.setItem(`exam_result_${examId}`, JSON.stringify(res));
      
      navigate(`/exam-result/${examId}`);
    } catch (err) {
      Swal.fire('خطأ!', err.response?.data?.detail || 'حدث خطأ أثناء تسليم الاختبار.', 'error');
      setSubmitting(false);
      setSubmitted(false);
      submittedRef.current = false;
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    
    const totalQuestions = exam.questions.length;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    let warningText = 'هل أنت متأكد من تسليم الاختبار وإنهاء الجلسة؟';
    if (unansweredCount > 0) {
      warningText = `لديك ${unansweredCount} أسئلة غير مجاب عليها. هل أنت متأكد من تسليم الاختبار؟`;
    }

    Swal.fire({
      title: 'تسليم الاختبار',
      text: warningText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، قم بالتسليم',
      cancelButtonText: 'تراجع',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#334155'
    }).then((result) => {
      if (result.isConfirmed) {
        submitAnswers(false);
      }
    });
  };

  const handleOptionSelect = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#090d16' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (screenBlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', background: '#090d16', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
          <FaExclamationTriangle style={{ fontSize: '3.5rem', color: '#ef4444', marginBottom: '15px' }} />
          <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>تم رصد تقسيم الشاشة!</h2>
          <p style={{ color: 'var(--text-muted-dark)', marginBottom: '15px', lineHeight: '1.7' }}>
            لا يمكنك دخول الاختبار أثناء تقسيم شاشة المتصفح مع تطبيق أو نافذة أخرى.
          </p>
          <p style={{ color: 'var(--text-muted-dark)', marginBottom: '30px', lineHeight: '1.7' }}>
            يرجى <strong>تكبير نافذة المتصفح (Maximize) بالكامل</strong> ثم أعد المحاولة.
          </p>
          <button
            onClick={() => {
              if (!isScreenSplit()) {
                setScreenBlocked(false);
                setLoading(true);
                window.location.reload();
              } else {
                Swal.fire('الشاشة لا تزال مقسمة!', 'يرجى تكبير النافذة (Maximize) أولاً.', 'error');
              }
            }}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            إعادة التحقق من حجم الشاشة
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', background: '#090d16', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
          <FaExclamationTriangle style={{ fontSize: '3.5rem', color: 'var(--danger-color)', marginBottom: '15px' }} />
          <h2 style={{ marginBottom: '10px' }}>تعذر بدء الاختبار</h2>
          <p style={{ color: 'var(--text-muted-dark)', marginBottom: '25px' }}>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ width: '100%' }}>العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', padding: '30px 15px', userSelect: 'none' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Anti-cheat overlay: hides page if blur occurs during submission loading */}
        {submitting && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(9, 13, 22, 0.95)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px'
          }}>
            <div className="spinner" style={{ margin: 0 }}></div>
            <h2 style={{ color: 'white' }}>جاري تسليم إجاباتك بأمان...</h2>
          </div>
        )}

        {/* Timer & Info Banner */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: timeLeft < 60 ? '2px solid #ef4444' : '1px solid var(--border-dark)',
          borderRadius: '16px',
          padding: '20px 25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: '20px',
          zIndex: 100,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'white', fontWeight: 'bold' }}>{exam.title}</h2>
            <p style={{ margin: '5px 0 0', color: 'var(--text-muted-dark)', fontSize: '0.85rem' }}>
              الطالب: <strong>{studentName}</strong>
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: timeLeft < 60 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
            padding: '10px 20px',
            borderRadius: '50px',
            color: timeLeft < 60 ? '#ef4444' : '#3b82f6',
            border: timeLeft < 60 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <FaClock style={{ fontSize: '1.2rem' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '1px' }}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Warning banner */}
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '10px',
          padding: '12px 18px',
          color: '#ef4444',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FaExclamationTriangle style={{ fontSize: '1.2rem', flexShrink: 0 }} />
          <span>تحذير: لا تفتح برامج أخرى، ولا تقسم الشاشة، ولا تنقر خارج هذا التصفح لتفادي الإقصاء التلقائي.</span>
        </div>

        {/* Active Question Box */}
        <div className="glass-card" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', marginBottom: '25px' }}>
            <span style={{
              backgroundColor: answers[currentQuestion.id] ? 'var(--success-color)' : '#3b82f6',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0,
              fontSize: '1rem'
            }}>
              {currentQuestionIndex + 1}
            </span>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem', lineHeight: '1.7' }}>
              {currentQuestion.question_text}
            </h3>
          </div>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '47px' }}>
            {['a', 'b', 'c', 'd'].map(optKey => {
              const optionText = currentQuestion[`option_${optKey}`];
              const isSelected = answers[currentQuestion.id] === optKey;

              return (
                <label
                  key={optKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-dark)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.2)',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 0 15px rgba(59,130,246,0.1)' : 'none'
                  }}
                >
                  <input
                    type="radio"
                    name={`question_${currentQuestion.id}`}
                    value={optKey}
                    checked={isSelected}
                    onChange={() => handleOptionSelect(currentQuestion.id, optKey)}
                    style={{ transform: 'scale(1.25)', accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  <span style={{
                    fontSize: '1rem',
                    color: isSelected ? '#3b82f6' : 'white',
                    fontWeight: isSelected ? 'bold' : 'normal'
                  }}>
                    {optionText}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation controls */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-dark)',
          padding: '20px 25px',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem' }}>
            تمت الإجابة على{' '}
            <strong style={{ color: '#10b981' }}>{Object.keys(answers).length}</strong>{' '}
            من مجموع <strong style={{ color: 'white' }}>{exam.questions.length}</strong> أسئلة
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '0.95rem' }}
            >
              السابق
              <FaChevronRight style={{ fontSize: '0.8rem' }} />
            </button>

            {currentQuestionIndex < exam.questions.length - 1 ? (
              <button
                onClick={nextQuestion}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '0.95rem' }}
              >
                <FaChevronLeft style={{ fontSize: '0.8rem' }} />
                التالي
              </button>
            ) : (
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="btn"
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '10px 22px',
                  fontSize: '0.95rem'
                }}
              >
                إنهاء وتسليم الإجابات
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TakeExam;
