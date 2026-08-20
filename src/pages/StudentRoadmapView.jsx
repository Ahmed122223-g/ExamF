import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  FaArrowRight, FaClock, FaCheckCircle, FaBookOpen, FaGraduationCap, 
  FaFileAlt, FaLock, FaKey, FaTelegramPlane, FaExternalLinkAlt, FaChevronDown, FaCheck, FaArrowDown
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import './StudentRoadmapView.css';

const StudentRoadmapView = () => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();

  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeItemModal, setActiveItemModal] = useState(null);
  const [completingItem, setCompletingItem] = useState(false);

  // Renewal Modal
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewCode, setRenewCode] = useState('');
  const [renewing, setRenewing] = useState(false);

  const fetchRoadmap = async () => {
    const token = localStorage.getItem('student_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.viewStudentRoadmap(roadmapId, token);
      setRoadmapData(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        Swal.fire({
          icon: 'warning',
          title: 'تنبيه الاشتراك',
          text: err.response?.data?.detail || 'انتهت صلاحية اشتراكك الشهري في هذا المسار أو أنك غير مسجل به.',
          confirmButtonText: 'تجديد الاشتراك بكود جديد'
        }).then(() => {
          setShowRenewModal(true);
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: err.response?.data?.detail || 'فشل في تحميل بيانات المسار.'
        });
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [roadmapId]);

  const handleOpenItem = async (item) => {
    const token = localStorage.getItem('student_token');
    try {
      const details = await apiService.getRoadmapItemDetails(item.id, token);
      setActiveItemModal(details);
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في فتح محتوى الكارت.', 'error');
    }
  };

  const handleCompleteItem = async (itemId) => {
    const token = localStorage.getItem('student_token');
    setCompletingItem(true);
    try {
      const res = await apiService.completeRoadmapItem(itemId, token);
      Swal.fire({
        icon: 'success',
        title: 'أحسنت! 🎉',
        text: res.message || 'تم تعليم الخطوة كمكتملة بنجاح.',
        timer: 1800,
        showConfirmButton: false
      });
      setActiveItemModal(null);
      fetchRoadmap();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'تعذر الاكتمال',
        text: err.response?.data?.detail || 'يرجى إكمال متطلبات الكارت أولاً.'
      });
    } finally {
      setCompletingItem(false);
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewCode.trim()) return;

    setRenewing(true);
    const token = localStorage.getItem('student_token');
    try {
      const res = await apiService.joinRoadmap(parseInt(roadmapId), renewCode.trim(), token);
      Swal.fire({
        icon: 'success',
        title: 'تم التجديد بنجاح! 🚀',
        text: res.message || 'تم تجديد اشتراكك لمدة 30 يوماً إضافية.',
      });
      setShowRenewModal(false);
      setRenewCode('');
      fetchRoadmap();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.detail || 'كود التجديد غير صالح.', 'error');
    } finally {
      setRenewing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="roadmap-container">
      {/* Top Header Card */}
      <div className="roadmap-header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem', borderRadius: '8px' }}
              >
                <FaArrowRight /> العودة للوحة التحكم
              </button>
              <span style={{ fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '4px 10px', borderRadius: '50px', fontWeight: 'bold' }}>
                مسار تدريبي متكامل
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', color: 'white', fontWeight: 'bold', margin: '5px 0' }}>
              🗺️ {roadmapData?.title}
            </h1>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.92rem', maxWidth: '680px', lineHeight: '1.6', margin: '5px 0 0 0' }}>
              {roadmapData?.description || 'اتبع الخطوات المتسلسلة والمترابطة لإتقان جميع مفاهيم هذا المسار خطوة بخطوة.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '6px 14px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <FaClock /> متبقي {roadmapData?.remaining_days} يوم على الاشتراك
            </span>
            <button 
              onClick={() => setShowRenewModal(true)} 
              className="btn"
              style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '3px 10px', borderRadius: '6px' }}
            >
              تجديد الكود 🔑
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '15px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '8px' }}>
            <span>إجمالي التقدم في المسار:</span>
            <span style={{ color: '#c084fc', fontWeight: 'bold' }}>
              {roadmapData?.completed_items} من {roadmapData?.total_items} خطوة مكتملة ({roadmapData?.progress_percent}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${roadmapData?.progress_percent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
              borderRadius: '6px',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }}></div>
          </div>
        </div>
      </div>

      {/* Interactive Stages & Sequential Path */}
      <div className="roadmap-timeline-wrapper">
        {roadmapData?.stages?.map((stage, sIdx) => (
          <div key={stage.id} className="roadmap-stage-card">
            <div className="roadmap-stage-badge">
              المرحلة {sIdx + 1}: {stage.title}
            </div>
            {stage.description && (
              <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.88rem', margin: '0 0 15px 0' }}>
                {stage.description}
              </p>
            )}

            {/* Cards Grid */}
            <div className="roadmap-cards-grid">
              {stage.items.map((item, iIdx) => (
                <div 
                  key={item.id} 
                  className={`roadmap-item-card ${item.is_completed ? 'completed' : ''}`}
                  onClick={() => handleOpenItem(item)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        خطوة #{item.global_step}
                      </span>
                      {item.is_completed ? (
                        <span style={{ color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                          <FaCheckCircle /> مكتمل
                        </span>
                      ) : (
                        <span style={{ color: '#a855f7', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {item.item_type === 'article' ? '📄 مقال' : '🎓 كورس'}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                      {item.item_type === 'article' ? '📄 ' : '🎓 '}
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, minHeight: '36px' }}>
                      {item.description || 'اضغط لاستعراض المحتوى وإنجاز هذه الخطوة.'}
                    </p>
                  </div>

                  {/* Flow Arrow Pointer */}
                  {item.has_next && (
                    <div className="roadmap-arrow-connector">
                      <FaArrowDown title="الخطوة التالية في المسار" />
                    </div>
                  )}

                  <button 
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      background: item.is_completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                      color: item.is_completed ? '#34d399' : '#c084fc',
                      border: `1px solid ${item.is_completed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`
                    }}
                  >
                    {item.is_completed ? 'مراجعة الخطوة' : 'ابدأ الخطوة ←'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Item Viewer Modal (Article / Course) */}
      {activeItemModal && (
        <div className="roadmap-modal-overlay" style={{ zIndex: 1200 }}>
          <div className="article-reader-modal">
            <button className="roadmap-modal-close" onClick={() => setActiveItemModal(null)}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '3px 10px', borderRadius: '50px', fontWeight: 'bold' }}>
                {activeItemModal.item_type === 'article' ? '📄 مقال تعليمي' : '🎓 كورس تطبيقي'}
              </span>
              {activeItemModal.is_completed && (
                <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '50px', fontWeight: 'bold' }}>
                  ✅ تم الإنجاز
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.45rem', color: 'white', fontWeight: 'bold', margin: '0 0 10px 0' }}>
              {activeItemModal.title}
            </h2>

            {activeItemModal.description && (
              <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginBottom: '15px' }}>
                {activeItemModal.description}
              </p>
            )}

            {/* Article Content */}
            {activeItemModal.item_type === 'article' && (
              <div>
                <div className="article-content-body">
                  {activeItemModal.article_content || 'لا يوجد نص مضاف لهذا المقال بعد.'}
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button
                    onClick={() => handleCompleteItem(activeItemModal.id)}
                    disabled={completingItem}
                    className="btn"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '12px',
                      fontSize: '1rem',
                      borderRadius: '10px'
                    }}
                  >
                    {completingItem ? 'جاري الحفظ...' : 'تم القراءة واكتمال المقال ✅'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveItemModal(null)}
                    style={{ width: '90px' }}
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            )}

            {/* Course Content Integration */}
            {activeItemModal.item_type === 'course' && (
              <div style={{ marginTop: '15px' }}>
                {activeItemModal.course ? (
                  <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(6, 182, 212, 0.25)', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '6px' }}>
                      الكورس المرتبط: {activeItemModal.course.course_code}
                    </div>
                    <h3 style={{ color: 'white', fontSize: '1.2rem', margin: '0 0 10px 0' }}>
                      {activeItemModal.course.title}
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0 0 15px 0' }}>
                      {activeItemModal.course.description || 'كورس شامل يحتوي على محاضرات وتمارين برمجية وأسئلة يجب حلها كاملة.'}
                    </p>

                    <Link
                      to={`/course/${activeItemModal.course.id}/roadmap`}
                      className="btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#0284c7',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        textDecoration: 'none'
                      }}
                    >
                      <FaGraduationCap /> فتح محتوى الكورس والمحاضرات والأسئلة ←
                    </Link>
                  </div>
                ) : (
                  <p style={{ color: '#f87171' }}>لم يتم ربط كورس محدد بهذا الكارت بعد.</p>
                )}

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button
                    onClick={() => handleCompleteItem(activeItemModal.id)}
                    disabled={completingItem}
                    className="btn"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '12px',
                      fontSize: '1rem',
                      borderRadius: '10px'
                    }}
                  >
                    {completingItem ? 'جاري التحقق من الأسئلة...' : 'إتمام كارت الكورس (بعد حل جميع الأسئلة) ✅'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setActiveItemModal(null)}
                    style={{ width: '90px' }}
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      {showRenewModal && (
        <div className="roadmap-modal-overlay" style={{ zIndex: 1300 }}>
          <div className="roadmap-modal-content" style={{ maxWidth: '520px', background: '#0f172a', borderRadius: '18px', padding: '25px' }}>
            <button className="roadmap-modal-close" onClick={() => setShowRenewModal(false)}>×</button>

            <h2 style={{ fontSize: '1.3rem', color: 'white', fontWeight: 'bold', marginBottom: '10px' }}>
              🔑 تجديد الاشتراك في المسار
            </h2>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '18px' }}>
              أدخل كود وصول جديد لتجديد اشتراكك في هذا المسار لمدة 30 يوماً إضافية.
            </p>

            <form onSubmit={handleRenewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="أدخل الكود المكون من 10 خانات"
                value={renewCode}
                onChange={(e) => setRenewCode(e.target.value)}
                maxLength={15}
                required
                style={{ textAlign: 'center', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1.1rem' }}
              />

              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px dashed rgba(6, 182, 212, 0.3)',
                fontSize: '0.82rem',
                color: '#94a3b8'
              }}>
                طلب كود جديد عبر بوت التلجرام:
                <a 
                  href="https://t.me/admaghbot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#38bdf8', fontWeight: 'bold', display: 'block', marginTop: '5px' }}
                >
                  <FaTelegramPlane /> t.me/admaghbot
                </a>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit" 
                  className="btn btn-accent" 
                  disabled={renewing || !renewCode.trim()} 
                  style={{ flex: 1 }}
                >
                  {renewing ? 'جاري التجديد...' : 'تأكيد التجديد'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRenewModal(false)}
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

export default StudentRoadmapView;
