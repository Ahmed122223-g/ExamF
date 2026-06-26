import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './CourseRoadmap.css';

// Section icons by index (cycles through if more than array length)
const SECTION_ICONS = ['🚀', '⚙️', '📊', '💡', '🎯', '🔥', '🏆', '📚'];

export default function CourseRoadmap() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('student_token');

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModalTopic, setActiveModalTopic] = useState(null);

  // Fetch roadmap data
  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCourseRoadmap(courseId, token);
      setRoadmap(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'فشل في تحميل خارطة الطريق.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && token) {
      fetchRoadmap();
    } else {
      setError('يرجى تسجيل الدخول أولاً.');
      setLoading(false);
    }
  }, [courseId, token]);

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner"></div>
        <p>جاري تحميل خارطة الطريق...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <h2 style={{ color: 'var(--danger-color)', marginBottom: '15px' }}>تنبيه</h2>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/dashboard')}>
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  // ---- Dynamic sections support ----
  // Backend returns roadmap.sections = [{id, title, description, items: [...]}, ...]
  const sections = roadmap.sections || [];

  // Flatten all items across all sections for global index / unlock logic
  const allItems = sections.flatMap(sec => sec.items || []);

  // Calculate actual elapsed days since registration
  const getElapsedDays = () => {
    if (!roadmap.registered_at) return 0;
    const start = new Date(roadmap.registered_at);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const elapsedDays = getElapsedDays();

  const getItemGlobalIndex = (id) => allItems.findIndex(item => item.id === id);

  // Logic: Unlocked if:
  // 1. First item (index === 0)
  // 2. Calendar date unlock matches/passed
  // 3. Relative days unlock matches/passed
  // 4. Fallback index-based sequential days unlock
  // 5. Or if the previous item was completed
  const isItemUnlocked = (id) => {
    const item = allItems.find(it => it.id === id);
    if (!item) return false;
    const index = getItemGlobalIndex(id);
    if (index === 0) return true;

    // Check specific calendar date unlock
    if (item.unlock_date) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (todayStr >= item.unlock_date) return true;
    }

    // Check relative day unlock
    if (item.unlock_days !== null && item.unlock_days !== undefined) {
      if (elapsedDays >= item.unlock_days) return true;
    }

    // Default sequential day unlock if no custom parameters are set
    if (!item.unlock_date && (item.unlock_days === null || item.unlock_days === undefined)) {
      if (index <= elapsedDays) return true;
    }

    // Check if the previous lesson was completed
    const prevItem = allItems[index - 1];
    return prevItem && prevItem.is_completed === true;
  };

  const toggleTopicCompletion = async (cardDbId) => {
    try {
      await apiService.toggleCardCompletion(cardDbId, token);
      // Refresh roadmap
      const data = await apiService.getCourseRoadmap(courseId, token);
      setRoadmap(data);
      // Update activeModalTopic if it is open
      if (activeModalTopic) {
        const updatedItems = (data.sections || []).flatMap(sec => sec.items || []);
        const matched = updatedItems.find(it => it.db_id === cardDbId);
        if (matched) {
          setActiveModalTopic(matched);
        }
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'فشل في تحديث حالة الدرس.');
    }
  };

  const unlockedCount = allItems.filter(item => isItemUnlocked(item.id)).length;

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Background Orbs */}
      <div className="roadmap-bg-glow">
        <div className="roadmap-orb roadmap-orb-1"></div>
        <div className="roadmap-orb roadmap-orb-2"></div>
      </div>

      {/* Navbar top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/dashboard" className="back-nav-btn">
          ← العودة للوحة التحكم
        </Link>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{roadmap.title}</span>
      </div>

      {/* Header */}
      <header className="app-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="app-title" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>{roadmap.title}</h1>
        <p className="app-subtitle" style={{ color: 'var(--text-muted-dark)', maxWidth: '700px', margin: '0 auto' }}>
          {roadmap.description || 'مسار تعليمي تفاعلي متكامل ومجدول. يفتح درس جديد كل يوم تلقائياً، أو عند إكمال الدرس السابق.'}
        </p>
      </header>

      {/* Day counter info */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted-dark)', fontSize: '0.9rem' }}>
        <span>📅 اليوم {elapsedDays + 1} في الكورس &nbsp;•&nbsp; تم فتح {unlockedCount} من {allItems.length} درساً</span>
      </div>

      {/* No sections message */}
      {sections.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>لا توجد أقسام أو دروس مضافة لهذا الكورس بعد.</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/dashboard')}>
            العودة للوحة التحكم
          </button>
        </div>
      )}

      {/* Dynamic Sections */}
      {sections.map((sec, secIdx) => (
        <section key={sec.id} className="roadmap-section">
          <div className="roadmap-section-header">
            <div className="roadmap-section-icon">{SECTION_ICONS[secIdx % SECTION_ICONS.length]}</div>
            <div>
              <h2 className="roadmap-section-title">{sec.title}</h2>
              {sec.description && (
                <p className="roadmap-section-desc">{sec.description}</p>
              )}
            </div>
          </div>

          <div className="roadmap-flow">
            {(sec.items || []).length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic', padding: '20px 0' }}>
                لا توجد دروس مضافة في هذا القسم بعد.
              </p>
            ) : (
              (sec.items || []).map((item, index) => {
                const unlocked = isItemUnlocked(item.id);
                const globalIdx = getItemGlobalIndex(item.id);
                const daysRemaining = globalIdx - elapsedDays;

                return (
                  <div
                    key={item.id}
                    className={`roadmap-card ${!unlocked ? 'locked' : ''} ${item.is_completed ? 'completed-glow' : ''}`}
                    onClick={() => unlocked && setActiveModalTopic(item)}
                    style={item.is_completed ? { borderColor: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' } : {}}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <span className="roadmap-card-step-badge">خطوة {index + 1}</span>
                        {!unlocked && (
                          <span className="roadmap-lock-badge">
                            {item.unlock_date
                              ? `🔒 يفتح بتاريخ: ${item.unlock_date}`
                              : (item.unlock_days !== null && item.unlock_days !== undefined)
                                ? `🔒 يفتح بعد ${item.unlock_days} يوم`
                                : `🔒 سيفتح بعد ${daysRemaining} يوم`
                            }
                          </span>
                        )}
                        {unlocked && item.is_completed && (
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            ✓ مكتمل
                          </span>
                        )}
                      </div>
                      <h4 className="roadmap-card-title">{item.title}</h4>
                      <p className="roadmap-card-desc">{item.description}</p>
                    </div>
                    <div className="roadmap-card-footer">
                      <span className="roadmap-card-btn" style={{ pointerEvents: 'none' }}>
                        {unlocked ? '📂 استعرض المحاضرين والدروس ←' : '🔒 مغلق'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ))}

      {/* Modal detail overlay */}
      {activeModalTopic && (
        <div className="roadmap-modal-overlay" onClick={() => setActiveModalTopic(null)}>
          <div className="roadmap-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="roadmap-modal-close" onClick={() => setActiveModalTopic(null)}>×</button>

            <div className="roadmap-modal-header">
              <span className="roadmap-card-step-badge">استعراض مصادر الدرس</span>
              <h3 className="roadmap-modal-topic-title">{activeModalTopic.title}</h3>
              <p style={{ marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                {activeModalTopic.description}
              </p>
            </div>

            <div className="roadmap-modal-body" style={{ maxHeight: '350px', overflowY: 'auto', paddingLeft: '0.5rem' }}>
              <h4 style={{ color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                اختر مسار الشرح الذي تفضله:
              </h4>

              {activeModalTopic.instructors && Object.keys(activeModalTopic.instructors).length > 0 ? (
                Object.keys(activeModalTopic.instructors).map((instructorKey) => {
                  const instructor = activeModalTopic.instructors[instructorKey];
                  if (!instructor || !instructor.videos || instructor.videos.length === 0) return null;
                  return (
                    <div key={instructorKey} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#06b6d4', fontSize: '1.05rem' }}>
                          👤 {instructor.name}
                        </span>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                          {instructor.videos.length} مقاطع
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {instructor.videos.map((vid, vidIdx) => (
                          <a
                            key={vidIdx}
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(255,255,255,0.03)',
                              padding: '0.6rem 1rem',
                              borderRadius: '8px',
                              color: '#f3f4f6',
                              textDecoration: 'none',
                              fontSize: '0.9rem',
                              border: '1px solid transparent',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#06b6d4';
                              e.currentTarget.style.background = 'rgba(6,182,212,0.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'transparent';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            }}
                          >
                            <span>🎥 {vid.title}</span>
                            <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>مشاهدة ←</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>لا توجد فيديوهات مضافة لهذا الكارت بعد.</p>
              )}

              {/* Linked Exams */}
              {activeModalTopic.exams && activeModalTopic.exams.length > 0 && (
                <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                  <h4 style={{ color: '#fff', marginBottom: '10px' }}>📝 اختبارات هذا الكارت:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeModalTopic.exams.map((ex) => (
                      <Link
                        key={ex.id}
                        to={`/register-student/${ex.id}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          color: '#fff',
                          textDecoration: 'none',
                          fontWeight: 'bold'
                        }}
                      >
                        <span>📄 {ex.title}</span>
                        <span style={{ color: '#f59e0b' }}>دخول الاختبار ←</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.2rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id={`complete-check-${activeModalTopic.id}`}
                  checked={!!activeModalTopic.is_completed}
                  onChange={() => toggleTopicCompletion(activeModalTopic.db_id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label
                  htmlFor={`complete-check-${activeModalTopic.id}`}
                  style={{ fontWeight: 'bold', cursor: 'pointer', color: activeModalTopic.is_completed ? '#10b981' : '#9ca3af' }}
                >
                  لقد أتممت دراسة مقاطع هذا الكارت (يفتح الكارت التالي مباشرة)
                </label>
              </div>
              <button
                className="roadmap-sim-btn"
                style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 16px' }}
                onClick={() => setActiveModalTopic(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
