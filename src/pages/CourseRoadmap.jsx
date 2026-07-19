import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './CourseRoadmap.css';

const SECTION_ICONS = ['🚀', '⚙️', '📊', '💡', '🎯', '🔥', '🏆', '📚'];

export default function CourseRoadmap() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('student_token');

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState(null);

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

  const handleRegisterSpecialization = async (courseCode) => {
    try {
      const res = await apiService.registerCourse(courseCode, token);
      alert(res.message || 'تم التسجيل في التخصص بنجاح!');
      fetchRoadmap();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'فشل التسجيل في التخصص.');
    }
  };

  useEffect(() => {
    if (courseId && token) {
      fetchRoadmap();
      apiService.getCourseLeaderboard(courseId, token)
        .then(data => setLeaderboard(data))
        .catch(() => {});
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
    if (index === 0 && !isItemLocked(id)) return true;

    for (let i = 0; i < index; i++) {
      const prev = allItems[i];
      if (prev.is_project && !prev.is_completed) return false;
    }

    if (isItemLocked(id)) return false;

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

  const isItemLocked = (id) => {
    const item = allItems.find(it => it.id === id);
    if (!item || !item.lock_date) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return todayStr >= item.lock_date;
  };

  const openCardDetail = (item) => {
    navigate(`/course/${courseId}/card/${item.db_id}`);
  };

  const unlockedCount = allItems.filter(item => isItemUnlocked(item.id)).length;

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      <div className="roadmap-bg-glow">
        <div className="roadmap-orb roadmap-orb-1"></div>
        <div className="roadmap-orb roadmap-orb-2"></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/dashboard" className="back-nav-btn">
          ← العودة للوحة التحكم
        </Link>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{roadmap.title}</span>
      </div>

      <header className="app-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="app-title" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>{roadmap.title}</h1>
        <p className="app-subtitle" style={{ color: 'var(--text-muted-dark)', maxWidth: '700px', margin: '0 auto' }}>
          {roadmap.description || 'مسار تعليمي تفاعلي متكامل ومجدول. يفتح درس جديد كل يوم تلقائياً، أو عند إكمال الدرس السابق.'}
        </p>
      </header>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-muted-dark)', fontSize: '0.9rem' }}>
        <span>📅 اليوم {elapsedDays + 1} في الكورس &nbsp;•&nbsp; تم فتح {unlockedCount} من {allItems.length} درساً</span>
      </div>

      {sections.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>لا توجد أقسام أو دروس مضافة لهذا الكورس بعد.</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/dashboard')}>
            العودة للوحة التحكم
          </button>
        </div>
      )}

      {leaderboard && leaderboard.total_cards > 0 && (
        <div className="leaderboard-section">
          <h2 className="leaderboard-title">🏆 لوحة المتصدرين</h2>

          <div className="leaderboard-podium">
            {leaderboard.top_three.map((s, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              const colors = ['#fbbf24', '#94a3b8', '#d97706'];
              const bgColors = ['rgba(251,191,36,0.10)', 'rgba(148,163,184,0.08)', 'rgba(217,119,6,0.08)'];
              const borderColors = ['rgba(251,191,36,0.35)', 'rgba(148,163,184,0.25)', 'rgba(217,119,6,0.25)'];
              return (
                <div key={s.student_id} className="leaderboard-card" style={{ background: bgColors[i], borderColor: borderColors[i] }}>
                  <div className="leaderboard-medal">{medals[i]}</div>
                  <div className="leaderboard-rank" style={{ color: colors[i] }}>#{i + 1}</div>
                  <div className="leaderboard-name">{s.student_name}</div>
                  <div className="leaderboard-stats">
                    <span className="leaderboard-completed">✅ {s.completed_count} / {leaderboard.total_cards}</span>
                    <span className="leaderboard-pct" style={{ color: colors[i] }}>{s.progress_percentage}%</span>
                  </div>
                  <div className="leaderboard-bar-bg">
                    <div className="leaderboard-bar-fill" style={{ width: `${s.progress_percentage}%`, background: colors[i] }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {leaderboard.my_rank && (
            <div className="leaderboard-my-rank">
              <span className="leaderboard-my-icon">📍</span>
              <span>ترتيبك: <strong>#{leaderboard.my_rank}</strong></span>
              <span className="leaderboard-my-divider">•</span>
              <span>أكملت <strong>{leaderboard.my_completed_cards}</strong> من <strong>{leaderboard.total_cards}</strong> كارت</span>
              <span className="leaderboard-my-divider">•</span>
              <span style={{ color: '#06b6d4', fontWeight: 700 }}>{leaderboard.my_progress_percentage}%</span>
            </div>
          )}
        </div>
      )}

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
                    className={`roadmap-card ${(!unlocked || isItemLocked(item.id)) ? 'locked' : ''} ${item.is_completed && !isItemLocked(item.id) ? 'completed-glow' : ''}`}
                    onClick={() => unlocked && openCardDetail(item)}
                    style={item.is_completed && !isItemLocked(item.id) ? { borderColor: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' } : {}}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                        <span className="roadmap-card-step-badge">
                          {item.is_project ? '🏗️ مشروع' : `خطوة ${index + 1}`}
                        </span>
                        {isItemLocked(item.id) && (
                          <span className="roadmap-lock-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                            🔒 مقفول منذ: {item.lock_date}
                          </span>
                        )}
                        {!isItemLocked(item.id) && !unlocked && (
                          <span className="roadmap-lock-badge">
                            {item.unlock_date
                              ? `🔒 يفتح بتاريخ: ${item.unlock_date}`
                              : (item.unlock_days !== null && item.unlock_days !== undefined)
                                ? `🔒 يفتح بعد ${item.unlock_days} يوم`
                                : `🔒 سيفتح بعد ${daysRemaining} يوم`
                            }
                          </span>
                        )}
                        {unlocked && !isItemLocked(item.id) && item.lock_date && (
                          <span className="roadmap-lock-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                            ⏳ يغلق بتاريخ: {item.lock_date}
                          </span>
                        )}
                        {unlocked && !isItemLocked(item.id) && item.is_completed && (
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
                        {isItemLocked(item.id)
                          ? '🔒 مقفول'
                          : unlocked
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

      {roadmap.specializations && roadmap.specializations.length > 0 && (
        <section className="specializations-section" style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem', paddingBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1rem', textAlign: 'center' }}>
            🎯 اختر تخصصك البرمجي التالي
          </h2>
          <p style={{ color: 'var(--text-muted-dark)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem' }}>
            بمجرد إتمامك لكورس C++ الاحترافي بالكامل (حل جميع الأسئلة والمشاريع والامتحانات)، يمكنك فتح أحد المسارات التخصصية التالية والبدء فيها مباشرة:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
            {roadmap.specializations.map(spec => {
              const isLocked = !roadmap.cpp_completed;
              return (
                <div 
                  key={spec.code} 
                  className={`specialization-card ${isLocked ? 'locked' : ''} ${spec.registered ? 'registered' : ''}`}
                  style={{
                    background: spec.registered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.4)',
                    border: spec.registered ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    opacity: isLocked ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>
                    {spec.code === 'AI101' ? '🤖' : spec.code === 'CS101' ? '🛡️' : '💻'}
                  </div>
                  <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '10px' }}>{spec.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>
                    {spec.code === 'AI101' 
                      ? 'مسار الذكاء الاصطناعي وتعلم الآلة والشبكات العصبية.'
                      : spec.code === 'CS101' 
                        ? 'مسار الأمن السيبراني واختبار الاختراق وحماية الأنظمة.'
                        : 'مسار تطوير الويب وتصميم وإطلاق التطبيقات التفاعلية.'}
                  </p>

                  {isLocked ? (
                    <button 
                      className="btn" 
                      disabled 
                      style={{ 
                        width: '100%', 
                        background: 'rgba(255,255,255,0.05)', 
                        color: '#64748b', 
                        cursor: 'not-allowed',
                        padding: '10px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px'
                      }}
                    >
                      🔒 مغلق حتى إنهاء C++
                    </button>
                  ) : spec.registered ? (
                    <button 
                      className="btn btn-success" 
                      onClick={() => navigate(`/course/${spec.course_id}/roadmap`)}
                      style={{ 
                        width: '100%',
                        background: '#10b981',
                        color: 'white',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🚀 دخول المسار الآن
                    </button>
                  ) : (
                    <button 
                      className="btn btn-accent" 
                      onClick={() => handleRegisterSpecialization(spec.code)}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      🔓 تسجيل وبدء التعلم
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
