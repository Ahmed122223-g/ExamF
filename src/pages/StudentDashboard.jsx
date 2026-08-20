import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  FaSignOutAlt, FaPlus, FaSearch, FaClipboardList, FaCheckCircle, 
  FaExclamationTriangle, FaLock, FaCalendarAlt, FaBookOpen, FaBell, 
  FaCog, FaMapMarkedAlt, FaRocket, FaClock, FaKey, FaTelegramPlane, FaExternalLinkAlt 
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const StudentDashboard = () => {
  const [courseCode, setCourseCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [myRoadmaps, setMyRoadmaps] = useState([]);
  const [availableRoadmaps, setAvailableRoadmaps] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Join Roadmap Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const [roadmapCode, setRoadmapCode] = useState('');
  const [joiningRoadmap, setJoiningRoadmap] = useState(false);

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

      const myCourses = await apiService.getMyCourses(token);
      setCourses(myCourses || []);

      const roadmaps = await apiService.getMyRoadmaps(token).catch(() => []);
      setMyRoadmaps(roadmaps || []);

      try {
        const notifData = await apiService.getMyNotifications(token);
        setUnreadCount(notifData.unread_count || 0);
      } catch (_) {}
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

  const handleRegisterCourse = async (e) => {
    e.preventDefault();
    if (!courseCode.trim()) return;

    setLoading(true);
    const token = localStorage.getItem('student_token');

    try {
      const res = await apiService.registerCourse(courseCode.trim().toUpperCase(), token);
      Swal.fire({
        icon: 'success',
        title: 'تم التسجيل في الكورس',
        text: res.message || 'تم تسجيلك بنجاح في الكورس.',
        timer: 2000,
        showConfirmButton: false
      });
      
      setCourseCode('');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'عذراً',
        text: err.response?.data?.detail || 'كود الكورس غير صحيح أو غير متاح حالياً.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenJoinRoadmapModal = async () => {
    const token = localStorage.getItem('student_token');
    setShowJoinModal(true);
    try {
      const list = await apiService.getAvailableRoadmaps(token);
      setAvailableRoadmaps(list || []);
      if (list && list.length > 0 && !selectedRoadmapId) {
        setSelectedRoadmapId(list[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', 'فشل في تحميل قائمة المسارات المتاحة.', 'error');
    }
  };

  const handleJoinRoadmapSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoadmapId || !roadmapCode.trim()) {
      Swal.fire('تنبيه', 'يرجى اختيار المسار وإدخال كود الاشتراك المكون من 10 خانات.', 'warning');
      return;
    }

    setJoiningRoadmap(true);
    const token = localStorage.getItem('student_token');

    try {
      const res = await apiService.joinRoadmap(parseInt(selectedRoadmapId), roadmapCode.trim(), token);
      Swal.fire({
        icon: 'success',
        title: 'مبروك! تم الانضمام للمسار 🎉',
        text: res.message || 'تم تفعيل اشتراكك بنجاح لمدة شهر.',
        confirmButtonText: 'الدخول للمسار الآن'
      }).then(() => {
        setShowJoinModal(false);
        setRoadmapCode('');
        fetchDashboardData();
        navigate(`/roadmap/${selectedRoadmapId}`);
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'فشل الانضمام',
        text: err.response?.data?.detail || 'كود الاشتراك غير صالح أو منتهي الصلاحية.'
      });
    } finally {
      setJoiningRoadmap(false);
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

  const selectedRoadmapObj = availableRoadmaps.find(r => r.id.toString() === selectedRoadmapId?.toString());

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(12px, 4vw, 30px) clamp(10px, 3vw, 20px)', direction: 'rtl', color: 'white' }}>
      
      <div className="glass-card" style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'normal', color: 'var(--text-muted-dark)' }}>
            مرحباً بك،
          </h2>
          <h1 style={{ fontSize: '1.6rem', margin: '5px 0 0 0', color: 'white', fontWeight: 'bold' }}>
            🎓 {studentData?.student_name}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/notifications"
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '42px', height: '42px', borderRadius: '10px',
                background: unreadCount > 0 ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${unreadCount > 0 ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: unreadCount > 0 ? '#3b82f6' : '#9ca3af', textDecoration: 'none', transition: 'all 0.2s'
              }}
              title="التنبيهات"
            >
              <FaBell style={{ fontSize: '1rem' }} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', left: '-6px',
                  background: '#ef4444', color: 'white', borderRadius: '50px',
                  fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px',
                  minWidth: '18px', textAlign: 'center', lineHeight: '16px'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/settings"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'rgba(6,182,212,0.12)',
                border: '1px solid rgba(6,182,212,0.3)',
                color: '#06b6d4', textDecoration: 'none', transition: 'all 0.2s'
              }}
              title="إعدادات الحساب والتطبيق"
            >
              <FaCog style={{ fontSize: '1.1rem' }} />
            </Link>

          <button 
            onClick={handleLogout} 
            className="btn btn-danger" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.95rem' }}
          >
            <FaSignOutAlt /> تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Registration Section (Course + Roadmap) */}
      <div className="responsive-grid-2" style={{ marginBottom: '35px', gap: '20px' }}>
        {/* Register in Course */}
        <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaPlus style={{ color: '#06b6d4' }} /> تسجيل في كورس جديد
            </h2>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', marginBottom: '18px' }}>
              أدخل كود الكورس الموفر لك للانضمام الفوري واستعراض المحاضرات والتمارين.
            </p>
          </div>

          <form onSubmit={handleRegisterCourse} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="مثال: CPP101"
                required
                disabled={loading}
                style={{ paddingRight: '35px', width: '100%', textTransform: 'uppercase' }}
              />
              <FaSearch style={{ position: 'absolute', top: '15px', right: '12px', color: 'var(--text-muted-dark)' }} />
            </div>
            <button 
              type="submit" 
              className="btn btn-accent" 
              disabled={loading || !courseCode.trim()} 
              style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
            >
              انضمام
            </button>
          </form>
        </div>

        {/* Join Roadmap Banner Card */}
        <div className="glass-card" style={{
          padding: '25px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(6, 182, 212, 0.08))',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#c084fc', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                <FaRocket style={{ color: '#a855f7' }} /> الانضمام إلى مسار تعليمي (Roadmap)
              </h2>
              <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe', padding: '2px 8px', borderRadius: '50px', fontWeight: 'bold' }}>
                اشتراك شهري
              </span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '18px', lineHeight: '1.6' }}>
              اختر مساراً برمجياً متكاملاً يحتوي على مقالات وكورسات متسلسلة خطوة بخطوة بكود اشتراك شهري.
            </p>
          </div>

          <button
            onClick={handleOpenJoinRoadmapModal}
            className="btn"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
          >
            <FaMapMarkedAlt /> استعراض المسارات والانضمام بكود ←
          </button>
        </div>
      </div>

      {/* Active Roadmaps Section */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaMapMarkedAlt style={{ color: '#a855f7' }} /> مساراتي التعليمية النشطة ({myRoadmaps.length})
        </h2>

        {myRoadmaps.length === 0 ? (
          <div className="glass-card" style={{ padding: '35px', textAlign: 'center', color: 'var(--text-muted-dark)' }}>
            <FaMapMarkedAlt style={{ fontSize: '2.5rem', color: '#475569', marginBottom: '10px' }} />
            <p style={{ fontSize: '1.1rem', margin: 0, color: '#94a3b8' }}>لا توجد مسارات تعليمية منضم إليها حالياً.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '6px', color: '#64748b' }}>اضغط على زر "الانضمام إلى مسار تعليمي" في الأعلى للبدء.</p>
          </div>
        ) : (
          <div className="responsive-grid-2">
            {myRoadmaps.map((rm) => (
              <div 
                key={rm.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderTop: '4px solid #8b5cf6',
                  background: 'rgba(15, 23, 42, 0.7)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '3px 10px', borderRadius: '50px', fontWeight: 'bold' }}>
                      مسار تعليمي
                    </span>
                    
                    {rm.is_active ? (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                        <FaClock /> متبقي {rm.remaining_days} يوم
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '3px 10px', borderRadius: '50px', fontWeight: 'bold' }}>
                        ⚠️ منتهي الصلاحية
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.3rem', color: 'white', marginTop: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
                    🗺️ {rm.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.88rem', lineHeight: '1.6', minHeight: '38px' }}>
                    {rm.description || 'مسار تعليمي تفاعلي متسلسل للتعلم والممارسة.'}
                  </p>

                  {/* Progress Bar */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>
                      <span>نسبة الإنجاز:</span>
                      <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{rm.completed_items} من {rm.total_items} خطوة ({rm.progress_percent}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${rm.progress_percent}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                        transition: 'width 0.5s ease-in-out'
                      }}></div>
                    </div>
                  </div>
                </div>

                <Link 
                  to={`/roadmap/${rm.id}`} 
                  className="btn"
                  style={{
                    width: '100%',
                    textDecoration: 'none',
                    textAlign: 'center',
                    background: rm.is_active ? 'rgba(139, 92, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: rm.is_active ? '#c084fc' : '#f87171',
                    border: `1px solid ${rm.is_active ? 'rgba(139, 92, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    fontWeight: 'bold',
                    padding: '10px'
                  }}
                >
                  {rm.is_active ? 'استكمال مسار التعلم ←' : 'تجديد الاشتراك بالمسار 🔑'}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBookOpen /> كورساتي المسجلة ({courses.length})
        </h2>

        {courses.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted-dark)' }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>لا توجد أي كورسات مسجلة بحسابك حالياً.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>يرجى إدخال كود الكورس في الأعلى للبدء.</p>
          </div>
        ) : (
          <div className="responsive-grid-2">
            {courses.map((course) => (
              <div 
                key={course.id}
                className="glass-card"
                style={{
                  padding: '25px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '15px',
                  borderTop: '4px solid #06b6d4'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    {course.course_code}
                  </span>
                  <h3 style={{ fontSize: '1.3rem', color: 'white', marginTop: '10px', marginBottom: '8px', fontWeight: 'bold' }}>
                    {course.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', lineHeights: '1.5', minHeight: '40px' }}>
                    {course.description || 'لا يوجد وصف متاح للكورس.'}
                  </p>
                </div>
                <Link to={`/course/${course.id}/roadmap`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                  عرض خارطة الطريق ←
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaClipboardList /> سجل اختباراتي ({attempts.length})
        </h2>

        {attempts.length === 0 ? (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted-dark)' }}>
            <p style={{ fontSize: '1rem', margin: 0 }}>لا توجد اختبارات مسجلة سابقة. ابدأ بالدخول للاختبارات من داخل مسارات الكورسات.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {attempts.map((attempt) => {
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

      {/* Join Roadmap Modal */}
      {showJoinModal && (
        <div className="roadmap-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="roadmap-modal-content" style={{ maxWidth: '580px', background: '#0f172a', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '20px', padding: '30px' }}>
            <button className="roadmap-modal-close" onClick={() => setShowJoinModal(false)}>×</button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '1.8rem' }}>
                <FaRocket />
              </div>
              <h2 style={{ fontSize: '1.4rem', color: 'white', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                الانضمام إلى مسار تعليمي (Roadmap)
              </h2>
              <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.88rem', margin: 0 }}>
                اختر المسار المراد دراسته وأدخل كود الوصول المخصص له لتفعيل اشتراكك لمدة 30 يوماً.
              </p>
            </div>

            <form onSubmit={handleJoinRoadmapSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Roadmap Selection */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  1. اختر المسار التعليمي (Roadmap):
                </label>
                {availableRoadmaps.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>جاري تحميل المسارات المتاحة...</p>
                ) : (
                  <select
                    className="form-input"
                    value={selectedRoadmapId}
                    onChange={(e) => setSelectedRoadmapId(e.target.value)}
                    required
                    style={{ background: '#1e293b', color: 'white', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                  >
                    {availableRoadmaps.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.stages_count} مراحل - {r.items_count} كارت)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Roadmap Welcome & Overview */}
              {selectedRoadmapObj && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  fontSize: '0.85rem',
                  lineHeight: '1.6'
                }}>
                  <div style={{ color: '#d8b4fe', fontWeight: 'bold', marginBottom: '4px' }}>
                    مرحباً بك في مسار: {selectedRoadmapObj.title} ✨
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {selectedRoadmapObj.description || 'مسار متكامل يضم شروحات ومقالات وتطبيقات عملية متدرجة.'}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '15px', color: '#38bdf8', fontSize: '0.8rem' }}>
                    <span>📍 {selectedRoadmapObj.stages_count} مراحل تدريبية</span>
                    <span>📚 {selectedRoadmapObj.items_count} كارت تفاعلي</span>
                  </div>
                </div>
              )}

              {/* Access Code Input */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  2. كود الاشتراك الخاص بهذا المسار (10 خانات):
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={roadmapCode}
                    onChange={(e) => setRoadmapCode(e.target.value)}
                    placeholder="مثال: aB8xK9mQ2Z"
                    maxLength={15}
                    required
                    style={{
                      background: '#1e293b',
                      color: 'white',
                      borderColor: 'rgba(139, 92, 246, 0.4)',
                      letterSpacing: '2px',
                      fontFamily: 'monospace',
                      fontSize: '1.1rem',
                      paddingRight: '42px',
                      textAlign: 'center'
                    }}
                  />
                  <FaKey style={{ position: 'absolute', top: '16px', right: '15px', color: '#a855f7' }} />
                </div>
              </div>

              {/* Telegram Bot Helper Box */}
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px dashed rgba(6, 182, 212, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.88rem', fontWeight: 'bold' }}>
                  <FaTelegramPlane style={{ fontSize: '1.1rem', color: '#06b6d4' }} /> ليس لديك كود اشتراك بعد؟
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0, lineHeight: '1.5' }}>
                  يمكنك الحصول على كود الاشتراك الشهري الخاص بك فوراً عبر التواصل مع بوت التلجرام الرسمي للمنصة.
                </p>
                <a
                  href="https://t.me/admaghbot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#0284c7',
                    color: 'white',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 'bold'
                  }}
                >
                  <FaTelegramPlane /> طلب كود عبر بوت التلجرام (@admaghbot) <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>

              {/* Submit & Cancel Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn"
                  disabled={joiningRoadmap || !roadmapCode.trim() || !selectedRoadmapId}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '12px',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {joiningRoadmap ? 'جاري التحقق والانضمام...' : 'تأكيد الانضمام والبدء 🚀'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowJoinModal(false)}
                  style={{ width: '90px', borderRadius: '10px' }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;
