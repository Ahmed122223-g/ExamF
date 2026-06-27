import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import './CardDetail.css';

export default function CardDetail() {
  const { courseId, cardDbId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('student_token');

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('videos');

  // Questions state
  const [cardQuestions, setCardQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState(null);

  // Project state
  const [projectSubmission, setProjectSubmission] = useState(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionFile, setSolutionFile] = useState(null);
  const [solutionFileName, setSolutionFileName] = useState('');
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectSuccess, setProjectSuccess] = useState('');

  // Completion state
  const [isCompleted, setIsCompleted] = useState(false);
  const [togglingCompletion, setTogglingCompletion] = useState(false);

  // ── Load card data ──────────────────────────────────────────
  const loadCard = async () => {
    try {
      setLoading(true);
      const roadmap = await apiService.getCourseRoadmap(courseId, token);
      const allItems = (roadmap.sections || []).flatMap(s => s.items || []);
      const found = allItems.find(it => String(it.db_id) === String(cardDbId));
      if (!found) {
        setError('لم يتم العثور على هذا الكارت.');
        return;
      }
      setCard(found);
      setIsCompleted(found.is_completed);

      if (found.is_project) {
        setProjectSubmission(found.project_submission || null);
        setSolutionText(found.project_submission?.solution_text || '');
        setSolutionFileName(found.project_submission?.solution_file_name || '');
      } else {
        const qs = await apiService.getCardQuestionsStudent(found.db_id, token);
        setCardQuestions(qs);
        const answersMap = {};
        qs.forEach(q => {
          answersMap[q.id] = q.my_answer
            ? { text: q.my_answer.answer_text || '', link: q.my_answer.answer_link || '' }
            : { text: '', link: '' };
        });
        setQuestionAnswers(answersMap);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'فشل في تحميل بيانات الكارت.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    loadCard();
  }, [courseId, cardDbId]);

  // ── Handlers ────────────────────────────────────────────────
  const handleSubmitAnswer = async (questionId) => {
    const ans = questionAnswers[questionId] || {};
    if (!ans.text && !ans.link) { alert('يرجى كتابة إجابة أو وضع رابط للحل.'); return; }
    setSubmittingAnswer(questionId);
    try {
      await apiService.submitQuestionAnswer(questionId, {
        answer_text: ans.text || null,
        answer_link: ans.link || null
      }, token);
      const qs = await apiService.getCardQuestionsStudent(card.db_id, token);
      setCardQuestions(qs);
      const answersMap = {};
      qs.forEach(q => {
        answersMap[q.id] = q.my_answer
          ? { text: q.my_answer.answer_text || '', link: q.my_answer.answer_link || '' }
          : { text: '', link: '' };
      });
      setQuestionAnswers(answersMap);
    } catch (err) {
      alert(err.response?.data?.detail || 'فشل في إرسال الإجابة.');
    } finally {
      setSubmittingAnswer(null);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!solutionText && !solutionFile) { alert('يرجى كتابة الحل أو رفع ملف.'); return; }
    setSubmittingProject(true);
    setProjectSuccess('');
    try {
      await apiService.submitProjectSolution(card.db_id, {
        solution_text: solutionText || null,
        solution_file_base64: solutionFile || null,
        solution_file_name: solutionFileName || null
      }, token);
      setProjectSuccess('تم تسليم المشروع بنجاح! في انتظار مراجعة الإدارة.');
      await loadCard();
    } catch (err) {
      alert(err.response?.data?.detail || 'فشل في تسليم المشروع.');
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleToggleCompletion = async () => {
    setTogglingCompletion(true);
    try {
      await apiService.toggleCardCompletion(card.db_id, token);
      setIsCompleted(prev => !prev);
    } catch (err) {
      alert(err.response?.data?.detail || 'فشل في تحديث الحالة.');
    } finally {
      setTogglingCompletion(false);
    }
  };

  // ── Render States ────────────────────────────────────────────
  if (loading) return (
    <div className="cd-page">
      <div className="cd-bg"><div className="cd-orb cd-orb1" /><div className="cd-orb cd-orb2" /></div>
      <div className="cd-loading"><div className="cd-spinner" /><p>جاري تحميل الكارت...</p></div>
    </div>
  );

  if (error) return (
    <div className="cd-page">
      <div className="cd-bg"><div className="cd-orb cd-orb1" /><div className="cd-orb cd-orb2" /></div>
      <div className="cd-error-box">
        <h2>⚠️ تنبيه</h2><p>{error}</p>
        <button className="cd-btn cd-btn-primary" onClick={() => navigate(`/course/${courseId}/roadmap`)}>← العودة للكورس</button>
      </div>
    </div>
  );

  if (!card) return null;

  const hasVideos = card.instructors && Object.keys(card.instructors).some(k => card.instructors[k]?.videos?.length > 0);
  const statusColor = { approved: '#10b981', rejected: '#ef4444', pending: '#f59e0b' }[projectSubmission?.status] || '#f59e0b';

  return (
    <div className="cd-page">
      <div className="cd-bg"><div className="cd-orb cd-orb1" /><div className="cd-orb cd-orb2" /></div>

      {/* Nav Bar */}
      <nav className="cd-navbar">
        <button className="cd-back-btn" onClick={() => navigate(`/course/${courseId}/roadmap`)}>
          ← العودة للكورس
        </button>
        <div className="cd-nav-badges">
          {card.is_project && <span className="cd-badge cd-badge-project">🏗️ مشروع</span>}
          {isCompleted && !card.is_project && <span className="cd-badge cd-badge-done">✓ مكتمل</span>}
        </div>
      </nav>

      {/* Hero Header */}
      <header className="cd-hero">
        <div className="cd-hero-inner">
          <span className="cd-step-badge">{card.is_project ? '🏗️ كارت مشروع' : '📚 درس'}</span>
          <h1 className="cd-title">{card.title}</h1>
          {card.description && (
            <div className="cd-description-box">
              <p className="cd-description">{card.description}</p>
            </div>
          )}
        </div>
      </header>

      {/* ─── PROJECT CARD ─── */}
      {card.is_project ? (
        <div className="cd-container">
          {projectSubmission && (
            <div className="cd-status-banner" style={{ borderColor: statusColor + '44', background: statusColor + '11' }}>
              <div className="cd-status-row">
                <span className="cd-status-label" style={{ color: statusColor }}>
                  {projectSubmission.status === 'approved' ? '✅ تم قبول مشروعك!' :
                   projectSubmission.status === 'rejected' ? '❌ المشروع مرفوض للتعديل' : '⏳ المشروع قيد المراجعة'}
                </span>
                {projectSubmission.grade != null && (
                  <span className="cd-grade-pill">الدرجة: {projectSubmission.grade}</span>
                )}
              </div>
              {projectSubmission.feedback_note && (
                <div className="cd-feedback">
                  <span className="cd-feedback-label">💬 ملاحظات المعلم:</span>
                  <p className="cd-feedback-text">{projectSubmission.feedback_note}</p>
                </div>
              )}
            </div>
          )}

          {(!projectSubmission || projectSubmission.status === 'rejected') ? (
            <div className="cd-section">
              <h2 className="cd-section-title">📤 تسليم المشروع</h2>
              {projectSuccess && <div className="cd-success-msg">{projectSuccess}</div>}
              <form onSubmit={handleProjectSubmit} className="cd-form">
                <div className="cd-form-group">
                  <label className="cd-label">✏️ كود الحل أو شرح ما قمت به:</label>
                  <textarea
                    className="cd-textarea cd-code-input"
                    value={solutionText}
                    onChange={e => setSolutionText(e.target.value)}
                    placeholder="اكتب الكود أو شرح الحل هنا..."
                    rows={10}
                  />
                </div>
                <div className="cd-form-group">
                  <label className="cd-label">📂 أو ارفع ملف (zip, rar, pdf, cpp, txt — max 2MB):</label>
                  <div className="cd-file-row">
                    <button type="button" className="cd-btn cd-btn-secondary" onClick={() => document.getElementById('proj-file').click()}>اختر ملف</button>
                    <span className="cd-file-name">{solutionFileName || 'لم يتم اختيار ملف'}</span>
                    <input id="proj-file" type="file" style={{ display: 'none' }} onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) { alert('الحد الأقصى 2MB'); return; }
                      const reader = new FileReader();
                      reader.onload = ev => { setSolutionFile(ev.target.result); setSolutionFileName(file.name); };
                      reader.readAsDataURL(file);
                    }} />
                  </div>
                </div>
                <button type="submit" disabled={submittingProject} className="cd-btn cd-btn-accent cd-btn-wide">
                  {submittingProject ? '⏳ جاري الرفع...' : '🚀 تسليم المشروع للإدارة'}
                </button>
              </form>
            </div>
          ) : (
            <div className="cd-section">
              <h2 className="cd-section-title">📋 الحل المقدم</h2>
              <div className="cd-submitted-box">
                <p className="cd-submitted-note">تم قفل التعديل — المشروع قيد المراجعة أو مقبول بالفعل.</p>
                {projectSubmission.solution_text && (
                  <div className="cd-code-preview">
                    <span className="cd-code-label">💻 الكود/الشرح:</span>
                    <pre className="cd-pre">{projectSubmission.solution_text}</pre>
                  </div>
                )}
                {projectSubmission.solution_file_name && (
                  <div className="cd-file-info">
                    <span className="cd-file-info-label">📄 الملف المرفوع:</span>
                    <span className="cd-file-info-name">{projectSubmission.solution_file_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── NORMAL CARD ─── */
        <div className="cd-container">
          <div className="cd-tabs">
            <button className={`cd-tab ${activeTab === 'videos' ? 'cd-tab-active-cyan' : ''}`} onClick={() => setActiveTab('videos')}>🎥 الفيديوهات</button>
            <button className={`cd-tab ${activeTab === 'questions' ? 'cd-tab-active-purple' : ''}`} onClick={() => setActiveTab('questions')}>
              📝 الأسئلة {cardQuestions.length > 0 && `(${cardQuestions.length})`}
            </button>
          </div>

          {activeTab === 'videos' && (
            <div className="cd-tab-content">
              {card.exams && card.exams.length > 0 && (
                <div className="cd-exams-section">
                  <h3 className="cd-section-title">📝 اختبارات هذا الكارت</h3>
                  <div className="cd-exams-list">
                    {card.exams.map(ex => (
                      <Link key={ex.id} to={`/register-student/${ex.id}`} className="cd-exam-link">
                        <span>📄 {ex.title}</span>
                        <span className="cd-exam-arrow">دخول ←</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {hasVideos ? (
                <div className="cd-instructors">
                  <h3 className="cd-section-title">اختر مسار الشرح الذي تفضله:</h3>
                  {Object.keys(card.instructors).map(key => {
                    const inst = card.instructors[key];
                    if (!inst?.videos?.length) return null;
                    return (
                      <div key={key} className="cd-instructor-card">
                        <div className="cd-instructor-header">
                          <span className="cd-instructor-name">👤 {inst.name}</span>
                          <span className="cd-video-count">{inst.videos.length} مقاطع</span>
                        </div>
                        <div className="cd-videos-list">
                          {inst.videos.map((vid, i) => (
                            <a key={i} href={vid.url} target="_blank" rel="noopener noreferrer" className="cd-video-link">
                              <span>🎥 {vid.title}</span>
                              <span className="cd-watch-label">مشاهدة ←</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="cd-empty"><p>🎬 لا توجد فيديوهات مضافة لهذا الكارت بعد.</p></div>
              )}

              <div className="cd-completion-bar">
                <label className="cd-completion-label">
                  <input type="checkbox" checked={isCompleted} onChange={handleToggleCompletion} disabled={togglingCompletion} className="cd-completion-check" />
                  <span style={{ color: isCompleted ? '#10b981' : '#9ca3af' }}>
                    {isCompleted ? '✅ لقد أتممت هذا الدرس — الكارت التالي مفتوح' : 'ضع علامة مكتمل عند الانتهاء من الدرس'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="cd-tab-content">
              {cardQuestions.length === 0 ? (
                <div className="cd-empty"><p>📝 لا توجد أسئلة مضافة لهذا الكارت بعد.</p></div>
              ) : (
                <div className="cd-questions-list">
                  {cardQuestions.map((q, qIdx) => {
                    const ans = questionAnswers[q.id] || { text: '', link: '' };
                    const answered = q.my_answer != null;
                    return (
                      <div key={q.id} className={`cd-question-card ${answered ? 'cd-question-answered' : ''}`}>
                        <div className="cd-question-header">
                          <span className="cd-question-num">سؤال {qIdx + 1}</span>
                          {answered && <span className="cd-answered-badge">✓ تمت الإجابة</span>}
                        </div>
                        {q.question_text && <p className="cd-question-text">{q.question_text}</p>}
                        {q.question_image_url && (
                          <div className="cd-question-img-wrap">
                            <img src={q.question_image_url} alt={`سؤال ${qIdx + 1}`} className="cd-question-img" onError={e => e.target.style.display = 'none'} />
                          </div>
                        )}
                        <div className="cd-answer-area">
                          <div className="cd-form-group">
                            <label className="cd-label">✏️ إجابتك النصية:</label>
                            <textarea
                              className="cd-textarea"
                              value={ans.text}
                              onChange={e => setQuestionAnswers(prev => ({
                                ...prev,
                                [q.id]: { ...prev[q.id], text: e.target.value }
                              }))}
                              placeholder="اكتب إجابتك هنا..."
                              rows={4}
                            />
                          </div>

                          <div className="cd-form-group" style={{ marginTop: '12px' }}>
                            <label className="cd-label">🔗 أو ضع رابط الحل (جوجل درايف، جيت هاب... إلخ):</label>
                            <input
                              type="text"
                              className="form-input"
                              value={ans.link}
                              onChange={e => setQuestionAnswers(prev => ({
                                ...prev,
                                [q.id]: { ...prev[q.id], link: e.target.value }
                              }))}
                              placeholder="https://drive.google.com/..."
                              style={{ width: '100%', background: '#1e293b', border: '1px solid var(--border-dark)', borderRadius: '8px', padding: '10px 14px', color: 'white' }}
                            />
                            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.8rem', marginTop: '6px' }}>
                              ⚠️ <strong>تنبيه هام للرفع على جوجل درايف:</strong> تأكد من تعديل إعدادات المشاركة لتجعل الرابط <strong>"متاح لأي شخص لديه الرابط" (Anyone with the link can view)</strong> ليتمكن المسؤول من قراءته.
                            </p>
                          </div>

                          <div className="cd-answer-actions" style={{ marginTop: '15px' }}>
                            {q.my_answer?.answer_link && (
                              <a href={q.my_answer.answer_link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '0.88rem' }}>
                                🔗 عرض الرابط المرسل سابقاً
                              </a>
                            )}
                            <button
                              className="cd-btn cd-btn-purple cd-btn-sm"
                              onClick={() => handleSubmitAnswer(q.id)}
                              disabled={submittingAnswer === q.id}
                              style={{ marginRight: 'auto' }}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
