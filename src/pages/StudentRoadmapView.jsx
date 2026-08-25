import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  FaArrowRight, FaClock, FaCheckCircle, FaGraduationCap,
  FaKey, FaTelegramPlane, FaArrowDown
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
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewCode, setRenewCode] = useState('');
  const [renewing, setRenewing] = useState(false);

  const fetchRoadmap = async () => {
    const token = localStorage.getItem('student_token');
    if (!token) { navigate('/login'); return; }
    try {
      setLoading(true);
      const data = await apiService.viewStudentRoadmap(roadmapId, token);
      setRoadmapData(data);
    } catch (err) {
      if (err.response?.status === 403) {
        Swal.fire({
          icon: 'warning',
          title: 'تنبيه الاشتراك',
          text: err.response?.data?.detail || 'انتهت صلاحية اشتراكك في هذا المسار.',
          confirmButtonText: 'تجديد الاشتراك بكود جديد'
        }).then(() => setShowRenewModal(true));
      } else {
        Swal.fire({ icon: 'error', title: 'خطأ', text: err.response?.data?.detail || 'فشل في تحميل المسار.' });
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoadmap(); }, [roadmapId]);

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
      Swal.fire({ icon: 'success', title: 'أحسنت! 🎉', text: res.message || 'تم تعليم الخطوة كمكتملة.', timer: 1800, showConfirmButton: false });
      setActiveItemModal(null);
      fetchRoadmap();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'تعذر الاكتمال', text: err.response?.data?.detail || 'يرجى إكمال متطلبات الكارت أولاً.' });
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
      Swal.fire({ icon: 'success', title: 'تم التجديد بنجاح! 🚀', text: res.message || 'تم تجديد اشتراكك لمدة 30 يوماً.' });
      setShowRenewModal(false);
      setRenewCode('');
      fetchRoadmap();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.detail || 'كود التجديد غير صالح.', 'error');
    } finally {
      setRenewing(false);
    }
  };

  // Convert plain-text URLs inside article content into clickable <a> elements
  const renderArticleContent = (text) => {
    if (!text) return 'لا يوجد نص مضاف لهذا المقال بعد.';
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0; // reset after test()
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#38bdf8',
              fontWeight: 600,
              textDecoration: 'underline',
              textDecorationColor: 'rgba(56,189,248,0.4)',
              textUnderlineOffset: '3px',
              wordBreak: 'break-all',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.target.style.color = '#7dd3fc'}
            onMouseLeave={e => e.target.style.color = '#38bdf8'}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="srm-loading">
        <div className="spinner" />
        <span>جاري تحميل المسار التعليمي...</span>
      </div>
    );
  }

  return (
    <div className="srm-page">

      {/* HEADER */}
      <div className="srm-header">
        <div className="srm-header-top">
          <div>
            <div style={{ marginBottom: '6px' }}>
              <button className="srm-back-btn" onClick={() => navigate('/dashboard')}>
                <FaArrowRight /> العودة للوحة التحكم
              </button>
              {' '}
              <span className="srm-badge">🗺️ مسار تدريبي متكامل</span>
            </div>
            <h1 className="srm-title">{roadmapData?.title}</h1>
            <p className="srm-description">
              {roadmapData?.description || 'اتبع الخطوات المتسلسلة لإتقان جميع مفاهيم هذا المسار خطوة بخطوة.'}
            </p>
          </div>
          <div className="srm-meta">
            <span className="srm-days-pill">
              <FaClock /> متبقي {roadmapData?.remaining_days} يوم على الاشتراك
            </span>
            <button className="srm-renew-btn" onClick={() => setShowRenewModal(true)}>
              تجديد الكود 🔑
            </button>
          </div>
        </div>

        <div className="srm-progress-block">
          <div className="srm-progress-labels">
            <span>إجمالي التقدم في المسار</span>
            <span className="srm-progress-pct">
              {roadmapData?.completed_items} / {roadmapData?.total_items} خطوة ({roadmapData?.progress_percent}%)
            </span>
          </div>
          <div className="srm-progress-track">
            <div className="srm-progress-fill" style={{ width: `${roadmapData?.progress_percent}%` }} />
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="srm-timeline">
        {roadmapData?.stages?.map((stage, sIdx) => (
          <div key={stage.id} className="srm-stage">
            <div className="srm-stage-dot" />
            <div className="srm-stage-inner">
              <div className="srm-stage-header">
                <span className="srm-stage-num">المرحلة {sIdx + 1}</span>
                <span className="srm-stage-title">{stage.title}</span>
              </div>
              {stage.description && <p className="srm-stage-desc">{stage.description}</p>}

              <div className="srm-cards-grid">
                {stage.items.map((item) => (
                  <div
                    key={item.id}
                    className={`srm-item-card ${item.is_completed ? 'completed' : ''}`}
                    onClick={() => handleOpenItem(item)}
                  >
                    <div className="srm-card-top">
                      <span className="srm-card-step">خطوة #{item.global_step}</span>
                      {item.is_completed ? (
                        <span className="srm-card-type done">
                          <FaCheckCircle style={{ marginLeft: 4 }} /> مكتمل
                        </span>
                      ) : (
                        <span className={`srm-card-type ${item.item_type}`}>
                          {item.item_type === 'article' ? '📄 مقال' : '🎓 كورس'}
                        </span>
                      )}
                    </div>

                    <p className="srm-card-title">
                      {item.item_type === 'article' ? '📄 ' : '🎓 '}{item.title}
                    </p>
                    <p className="srm-card-desc">
                      {item.description || 'اضغط لاستعراض المحتوى وإنجاز هذه الخطوة.'}
                    </p>

                    {item.has_next && (
                      <div className="srm-connector"><FaArrowDown /></div>
                    )}

                    <button className={`srm-card-btn ${item.is_completed ? 'review' : 'open'}`}>
                      {item.is_completed ? '🔍 مراجعة الخطوة' : 'ابدأ الخطوة ←'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ITEM MODAL */}
      {activeItemModal && (
        <div className="srm-overlay" onClick={(e) => e.target === e.currentTarget && setActiveItemModal(null)}>
          <div className="srm-modal">
            <button className="srm-modal-close" onClick={() => setActiveItemModal(null)}>×</button>

            <div className="srm-modal-badges">
              <span className="srm-badge">
                {activeItemModal.item_type === 'article' ? '📄 مقال تعليمي' : '🎓 كورس تطبيقي'}
              </span>
              {activeItemModal.is_completed && (
                <span className="srm-badge" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }}>
                  ✅ تم الإنجاز
                </span>
              )}
            </div>

            <h2 className="srm-modal-title">{activeItemModal.title}</h2>
            {activeItemModal.description && (
              <p className="srm-modal-desc">{activeItemModal.description}</p>
            )}

            {activeItemModal.item_type === 'article' && (
              <>
                <div className="srm-article-body">
                  {renderArticleContent(activeItemModal.article_content)}
                </div>
                <div className="srm-modal-actions">
                  <button
                    className="srm-btn-complete article-style"
                    onClick={() => handleCompleteItem(activeItemModal.id)}
                    disabled={completingItem || activeItemModal.is_completed}
                  >
                    {completingItem ? 'جاري الحفظ...' : activeItemModal.is_completed ? '✅ تم قراءة المقال مسبقاً' : 'تم القراءة واكتمال المقال ✅'}
                  </button>
                  <button className="srm-btn-secondary" onClick={() => setActiveItemModal(null)}>إغلاق</button>
                </div>
              </>
            )}

            {activeItemModal.item_type === 'course' && (
              <>
                {activeItemModal.course ? (
                  <div className="srm-course-box">
                    <div className="srm-course-code">الكورس المرتبط: {activeItemModal.course.course_code}</div>
                    <h3 className="srm-course-title">{activeItemModal.course.title}</h3>
                    <p className="srm-course-desc">
                      {activeItemModal.course.description || 'كورس شامل يحتوي على محاضرات وتمارين برمجية وأسئلة يجب حلها كاملة.'}
                    </p>
                    <Link to={`/course/${activeItemModal.course.id}/roadmap`} className="srm-course-link">
                      <FaGraduationCap /> فتح محتوى الكورس والمحاضرات والأسئلة ←
                    </Link>
                  </div>
                ) : (
                  <p style={{ color: '#f87171', marginBottom: 20 }}>لم يتم ربط كورس محدد بهذا الكارت بعد.</p>
                )}
                <div className="srm-modal-actions">
                  <button
                    className="srm-btn-complete"
                    onClick={() => handleCompleteItem(activeItemModal.id)}
                    disabled={completingItem || activeItemModal.is_completed}
                  >
                    {completingItem ? 'جاري التحقق...' : activeItemModal.is_completed ? '✅ تم إتمام كارت الكورس' : 'إتمام كارت الكورس (بعد حل جميع الأسئلة) ✅'}
                  </button>
                  <button className="srm-btn-secondary" onClick={() => setActiveItemModal(null)}>إغلاق</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* RENEW MODAL */}
      {showRenewModal && (
        <div className="srm-overlay" onClick={(e) => e.target === e.currentTarget && setShowRenewModal(false)}>
          <div className="srm-modal srm-renew-modal">
            <button className="srm-modal-close" onClick={() => setShowRenewModal(false)}>×</button>
            <h2 className="srm-modal-title">🔑 تجديد الاشتراك في المسار</h2>
            <p className="srm-modal-desc">
              أدخل كود وصول جديد لتجديد اشتراكك في هذا المسار لمدة 30 يوماً إضافية.
            </p>
            <form onSubmit={handleRenewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="srm-code-input-wrap">
                <input
                  type="text"
                  className="srm-code-input"
                  placeholder="أدخل الكود (10 خانات)"
                  value={renewCode}
                  onChange={(e) => setRenewCode(e.target.value)}
                  maxLength={15}
                  required
                />
                <FaKey className="srm-code-icon" />
              </div>
              <div className="srm-tg-box">
                ليس لديك كود؟ احصل عليه عبر بوت التلجرام:
                <a href="https://t.me/admaghbot" target="_blank" rel="noopener noreferrer" className="srm-tg-link">
                  <FaTelegramPlane /> @admaghbot
                </a>
              </div>
              <div className="srm-modal-actions">
                <button type="submit" className="srm-btn-complete" disabled={renewing || !renewCode.trim()}>
                  {renewing ? 'جاري التجديد...' : 'تأكيد التجديد'}
                </button>
                <button type="button" className="srm-btn-secondary" onClick={() => setShowRenewModal(false)}>
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