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
  const [modalTab, setModalTab] = useState('videos'); // 'videos' | 'questions'
  const [cardQuestions, setCardQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({}); // {questionId: {text, file, fileName}}
  const [submittingAnswer, setSubmittingAnswer] = useState(null); // questionId being submitted

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

  const openModal = async (item) => {
    setActiveModalTopic(item);
    setModalTab('videos');
    setCardQuestions([]);
    setQuestionAnswers({});
    // Fetch questions for this card
    try {
      const qs = await apiService.getCardQuestionsStudent(item.db_id, token);
      setCardQuestions(qs);
      // Pre-fill existing answers
      const answersMap = {};
      qs.forEach(q => {
        if (q.my_answer) {
          answersMap[q.id] = {
            text: q.my_answer.answer_text || '',
            fileName: q.my_answer.answer_file_name || '',
            file: null
          };
        } else {
          answersMap[q.id] = { text: '', fileName: '', file: null };
        }
      });
      setQuestionAnswers(answersMap);
    } catch (e) {
      setCardQuestions([]);
    }
  };

  const handleFileChange = (questionId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQuestionAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          file: ev.target.result, // base64
          fileName: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAnswer = async (questionId) => {
    const ans = questionAnswers[questionId] || {};
    if (!ans.text && !ans.file) {
      alert('يرجى كتابة إجابة أو رفع ملف.');
      return;
    }
    setSubmittingAnswer(questionId);
    try {
      await apiService.submitQuestionAnswer(questionId, {
        answer_text: ans.text || null,
        answer_file_base64: ans.file || null,
        answer_file_name: ans.fileName || null
      }, token);
      // Refresh questions
      const qs = await apiService.getCardQuestionsStudent(activeModalTopic.db_id, token);
      setCardQuestions(qs);
      alert('تم حفظ إجابتك بنجاح ✅');
    } catch (e) {
      alert(e.response?.data?.detail || 'فشل في حفظ الإجابة.');
    } finally {
      setSubmittingAnswer(null);
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
                    onClick={() => unlocked && openModal(item)}
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

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1rem' }}>
              <button
                onClick={() => setModalTab('videos')}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                  background: modalTab === 'videos' ? 'rgba(6,182,212,0.15)' : 'transparent',
                  color: modalTab === 'videos' ? '#06b6d4' : '#9ca3af',
                  borderBottom: modalTab === 'videos' ? '2px solid #06b6d4' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                🎥 الفيديوهات
              </button>
              <button
                onClick={() => setModalTab('questions')}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                  background: modalTab === 'questions' ? 'rgba(168,85,247,0.15)' : 'transparent',
                  color: modalTab === 'questions' ? '#a855f7' : '#9ca3af',
                  borderBottom: modalTab === 'questions' ? '2px solid #a855f7' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                📝 الأسئلة {cardQuestions.length > 0 && `(${cardQuestions.length})`}
              </button>
            </div>

            <div className="roadmap-modal-body" style={{ maxHeight: '350px', overflowY: 'auto', paddingLeft: '0.5rem' }}>

              {/* ─── Videos Tab ─── */}
              {modalTab === 'videos' && (
                <>
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
                </>
              )}

              {/* ─── Questions Tab ─── */}
              {modalTab === 'questions' && (
                <>
                  {cardQuestions.length === 0 ? (
                    <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
                      لا توجد أسئلة مضافة لهذا الكارت بعد.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {cardQuestions.map((q, qIdx) => {
                        const ans = questionAnswers[q.id] || { text: '', fileName: '', file: null };
                        const alreadyAnswered = q.my_answer != null;
                        return (
                          <div key={q.id} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: alreadyAnswered ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            padding: '15px'
                          }}>
                            {/* Question header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <span style={{ fontWeight: 'bold', color: '#a855f7', fontSize: '0.95rem' }}>
                                سؤال {qIdx + 1}
                              </span>
                              {alreadyAnswered && (
                                <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '6px' }}>
                                  ✓ تمت الإجابة
                                </span>
                              )}
                            </div>

                            {/* Question text */}
                            {q.question_text && (
                              <p style={{ color: '#e5e7eb', marginBottom: '10px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                                {q.question_text}
                              </p>
                            )}

                            {/* Question image */}
                            {q.question_image_url && (
                              <div style={{ marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <img
                                  src={q.question_image_url}
                                  alt={`سؤال ${qIdx + 1}`}
                                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', background: '#fff', display: 'block' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </div>
                            )}

                            {/* Answer area */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '8px' }}>
                              <label style={{ color: '#9ca3af', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                                ✏️ إجابتك:
                              </label>
                              <textarea
                                value={ans.text}
                                onChange={(e) => setQuestionAnswers(prev => ({ ...prev, [q.id]: { ...prev[q.id], text: e.target.value } }))}
                                placeholder="اكتب إجابتك هنا..."
                                style={{
                                  width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '0.9rem', resize: 'vertical',
                                  fontFamily: 'inherit'
                                }}
                              />

                              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <label style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                  background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
                                  padding: '6px 14px', borderRadius: '8px', color: '#a855f7', fontSize: '0.85rem'
                                }}>
                                  📎 رفع ملف
                                  <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf,.txt"
                                    onChange={(e) => handleFileChange(q.id, e)}
                                    style={{ display: 'none' }}
                                  />
                                </label>
                                {(ans.fileName || (q.my_answer && q.my_answer.answer_file_name)) && (
                                  <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                                    📄 {ans.fileName || q.my_answer?.answer_file_name}
                                  </span>
                                )}

                                <button
                                  onClick={() => handleSubmitAnswer(q.id)}
                                  disabled={submittingAnswer === q.id}
                                  style={{
                                    marginRight: 'auto', background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                                    border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '8px',
                                    cursor: submittingAnswer === q.id ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold', fontSize: '0.85rem', opacity: submittingAnswer === q.id ? 0.6 : 1
                                  }}
                                >
                                  {submittingAnswer === q.id ? 'جاري الإرسال...' : '📤 إرسال الإجابة'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
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
