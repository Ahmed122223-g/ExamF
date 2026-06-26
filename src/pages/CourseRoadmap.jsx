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

  const sections = roadmap.sections || [];
  const allItems = sections.flatMap(sec => sec.items || []);

  const getElapsedDays = () => {
    if (!roadmap.registered_at) return 0;
    const start = new Date(roadmap.registered_at);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const elapsedDays = getElapsedDays();
  const getItemGlobalIndex = (id) => allItems.findIndex(item => item.id === id);

  const isItemUnlocked = (id) => {
    const item = allItems.find(it => it.id === id);
    if (!item) return false;
    const index = getItemGlobalIndex(id);
    if (index === 0) return true;

    // Block if any previous project card is not completed
    for (let i = 0; i < index; i++) {
      const prev = allItems[i];
      if (prev.is_project && !prev.is_completed) return false;
    }

    if (item.unlock_date) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (todayStr >= item.unlock_date) return true;
    }

    if (item.unlock_days !== null && item.unlock_days !== undefined) {
      if (elapsedDays >= item.unlock_days) return true;
    }

    if (!item.unlock_date && (item.unlock_days === null || item.unlock_days === undefined)) {
      if (index <= elapsedDays) return true;
    }

    const prevItem = allItems[index - 1];
    return prevItem && prevItem.is_completed === true;
  };

  const openCardDetail = (item) => {
    navigate(`/course/${courseId}/card/${item.db_id}`);
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
                    onClick={() => unlocked && openCardDetail(item)}
                    style={item.is_completed ? { borderColor: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' } : {}}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <span className="roadmap-card-step-badge">
                          {item.is_project ? '🏗️ مشروع' : `خطوة ${index + 1}`}
                        </span>
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
                      {item.description && (
                        <p className="roadmap-card-desc" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.85rem',
                          color: '#9ca3af',
                          lineHeight: '1.5',
                          margin: '0.4rem 0 0'
                        }}>
                          {item.description.length > 120
                            ? item.description.slice(0, 120) + '…'
                            : item.description}
                        </p>
                      )}
                    </div>
                    <div className="roadmap-card-footer">
                      <span className="roadmap-card-btn" style={{ pointerEvents: 'none' }}>
                        {unlocked
                          ? item.is_project ? '🏗️ فتح صفحة المشروع ←' : '📂 استعرض المحاضرين والدروس ←'
                          : '🔒 مغلق'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
