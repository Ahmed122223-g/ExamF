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

  const [cardQuestions, setCardQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState(null);

  const [cardFiles, setCardFiles] = useState([]);

  const [projectSubmission, setProjectSubmission] = useState(null);
  const [solutionText, setSolutionText] = useState('');
  const [solutionLink, setSolutionLink] = useState('');
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectSuccess, setProjectSuccess] = useState('');

  const [isCompleted, setIsCompleted] = useState(false);
  const [togglingCompletion, setTogglingCompletion] = useState(false);

  // Certificate state
  const [certStatus, setCertStatus] = useState(null); // null | status object from API
  const [claimingCert, setClaimingCert] = useState(false);
  const [certPdfLoading, setCertPdfLoading] = useState(false);

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

      if (found.lock_date) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (todayStr >= found.lock_date) {
          setError(`🔒 هذا الكارت مقفول منذ تاريخ: ${found.lock_date} ولا يمكن تصفحه.`);
          return;
        }
      }

      const foundIndex = allItems.findIndex(it => String(it.db_id) === String(cardDbId));
      for (let i = 0; i < foundIndex; i++) {
        const prev = allItems[i];
        if (prev.is_project) {
          if (!prev.is_completed) {
            setError('🔒 لا يمكنك تصفح هذا الكارت. يجب إكمال المشاريع السابقة أولاً.');
            return;
          }
        } else {
          if (!prev.all_questions_answered) {
            setError('🔒 لا يمكنك تصفح هذا الكارت. يجب حل جميع أسئلة الكروت السابقة أولاً.');
            return;
          }
        }
      }

      setCard(found);
      setIsCompleted(found.is_completed);

      if (found.is_certificate) {
        // Load certificate status from API
        try {
          const cs = await apiService.getCourseCertificateStatus(courseId, token);
          setCertStatus(cs);
        } catch (_) {
          setCertStatus({ status: 'ineligible', eligible: false, checklist: {}, calculated_score: 0, calculated_grade: '', message: 'تعذر تحميل بيانات الشهادة. يرجى المحاولة لاحقاً.' });
        }
        setLoading(false);
        return;
      } else if (found.is_project) {
        setProjectSubmission(found.project_submission || null);
        setSolutionText(found.project_submission?.solution_text || '');
        setSolutionLink(found.project_submission?.solution_link || '');
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

        try {
          const fls = await apiService.getCardFilesStudent(found.db_id, token);
          setCardFiles(fls);
        } catch (_) {
          setCardFiles([]);
        }
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
    if (!solutionText && !solutionLink) { alert('يرجى كتابة الحل أو إضافة رابط المشروع.'); return; }
    if (solutionLink && !solutionLink.startsWith('http')) { alert('الرابط غير صحيح. يجب أن يبدأ بـ http:// أو https://'); return; }
    setSubmittingProject(true);
    setProjectSuccess('');
    try {
      await apiService.submitProjectSolution(card.db_id, {
        solution_text: solutionText || null,
        solution_link: solutionLink || null,
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

      <nav className="cd-navbar">
        <button className="cd-back-btn" onClick={() => navigate(`/course/${courseId}/roadmap`)}>
          ← العودة للكورس
        </button>
        <div className="cd-nav-badges">
          {card.is_certificate && <span className="cd-badge" style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.4)' }}>🎓 شهادة</span>}
          {card.is_project && !card.is_certificate && <span className="cd-badge cd-badge-project">🏗️ مشروع</span>}
          {isCompleted && !card.is_project && !card.is_certificate && <span className="cd-badge cd-badge-done">✓ مكتمل</span>}
        </div>
      </nav>

      <header className="cd-hero" style={card.is_certificate ? { background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(234,179,8,0.05) 100%)', borderBottom: '1px solid rgba(250,204,21,0.2)' } : {}}>
        <div className="cd-hero-inner">
          <span className="cd-step-badge" style={card.is_certificate ? { background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.4)' } : {}}>
            {card.is_certificate ? '🎓 شهادة إتمام الكورس' : card.is_project ? '🏗️ كارت مشروع' : '📚 درس'}
          </span>
          <h1 className="cd-title">{card.title}</h1>
          {card.description && (
            <div className="cd-description-box">
              <p className="cd-description">{card.description}</p>
            </div>
          )}
        </div>
      </header>

      {card.is_certificate ? (
        <CertificatePanel
          certStatus={certStatus}
          courseId={courseId}
          token={token}
          claimingCert={claimingCert}
          setClaimingCert={setClaimingCert}
          certPdfLoading={certPdfLoading}
          setCertPdfLoading={setCertPdfLoading}
          apiService={apiService}
          onCertIssued={(cs) => setCertStatus(cs)}
          navigate={navigate}
        />
      ) : card.is_project ? (
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
                  <label className="cd-label">🔗 رابط المشروع على Google Drive أو GitHub:</label>
                  <input
                    type="url"
                    className="cd-input"
                    value={solutionLink}
                    onChange={e => setSolutionLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                  />
                  <div className="cd-drive-instructions">
                    <p className="cd-drive-title">📋 تعليمات مشاركة Google Drive:</p>
                    <ol className="cd-drive-steps">
                      <li>افتح الملف أو المجلد على Google Drive</li>
                      <li>انقر بالزر الأيمن ← <strong>"مشاركة"</strong> أو <strong>"Share"</strong></li>
                      <li>في إعدادات الوصول اختر: <strong>"أي شخص لديه الرابط"</strong> (Anyone with the link)</li>
                      <li>تأكد أن الإذن على <strong>"مشاهد"</strong> (Viewer) على الأقل</li>
                      <li>انسخ الرابط وضعه في الحقل أعلاه ✅</li>
                    </ol>
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
                {projectSubmission.solution_link && (
                  <div className="cd-file-info" style={{ marginTop: '10px' }}>
                    <span className="cd-file-info-label">🔗 رابط المشروع: </span>
                    <a href={projectSubmission.solution_link} target="_blank" rel="noreferrer" className="cd-file-info-name" style={{ color: '#06b6d4', textDecoration: 'underline' }}>
                      {projectSubmission.solution_link}
                    </a>
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
            <button className={`cd-tab ${activeTab === 'files' ? 'cd-tab-active-emerald' : ''}`} onClick={() => setActiveTab('files')}>
              📁 ملفات الشرح {cardFiles.length > 0 && `(${cardFiles.length})`}
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
                    const isReviewed = q.my_answer?.is_reviewed || false;
                    const allowRetry = q.my_answer?.allow_retry || false;
                    const isLocked = isReviewed && !allowRetry;
                    return (
                      <div key={q.id} className={`cd-question-card ${answered ? 'cd-question-answered' : ''}`}
                        style={isLocked ? { borderColor: 'rgba(16,185,129,0.4)', boxShadow: '0 0 10px rgba(16,185,129,0.08)' } : {}}>
                        <div className="cd-question-header">
                          <span className="cd-question-num">سؤال {qIdx + 1}</span>
                          {answered && !isReviewed && <span className="cd-answered-badge">✓ تمت الإجابة — في انتظار المراجعة</span>}
                          {isReviewed && !allowRetry && <span className="cd-answered-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>✅ تمت المراجعة — مقفول</span>}
                          {isReviewed && allowRetry && <span className="cd-answered-badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>🔄 تمت المراجعة — يمكنك إعادة الإجابة</span>}
                        </div>
                        {q.question_text && <p className="cd-question-text">{q.question_text}</p>}
                        {q.question_image_url && (
                          <div className="cd-question-img-wrap">
                            <img src={q.question_image_url} alt={`سؤال ${qIdx + 1}`} className="cd-question-img" onError={e => e.target.style.display = 'none'} />
                          </div>
                        )}

                        {q.my_answer?.admin_feedback && (
                          <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '10px', padding: '12px 16px', marginBottom: '12px', borderRight: '3px solid #10b981' }}>
                            <p style={{ color: '#34d399', fontWeight: 700, margin: '0 0 6px', fontSize: '0.8rem' }}>💬 ملاحظة الأدمن:</p>
                            <p style={{ color: '#a7f3d0', margin: 0, fontSize: '0.88rem', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{q.my_answer.admin_feedback}</p>
                          </div>
                        )}

                        <div className="cd-answer-area">
                          <div className="cd-form-group">
                            <label className="cd-label">✏️ إجابتك النصية:</label>
                            <textarea
                              className="cd-textarea"
                              value={ans.text}
                              onChange={e => !isLocked && setQuestionAnswers(prev => ({
                                ...prev,
                                [q.id]: { ...prev[q.id], text: e.target.value }
                              }))}
                              placeholder={isLocked ? 'تمت مراجعة هذه الإجابة ولا يمكن تعديلها.' : 'اكتب إجابتك هنا...'}
                              rows={4}
                              disabled={isLocked}
                              style={isLocked ? { opacity: 0.6, cursor: 'not-allowed', background: 'rgba(0,0,0,0.3)' } : {}}
                            />
                          </div>

                          <div className="cd-form-group" style={{ marginTop: '12px' }}>
                            <label className="cd-label">🔗 أو ضع رابط الحل (جوجل درايف، جيت هاب... إلخ):</label>
                            <input
                              type="text"
                              className="form-input"
                              value={ans.link}
                              onChange={e => !isLocked && setQuestionAnswers(prev => ({
                                ...prev,
                                [q.id]: { ...prev[q.id], link: e.target.value }
                              }))}
                              placeholder={isLocked ? 'تمت المراجعة — مقفول' : 'https://drive.google.com/...'}
                              disabled={isLocked}
                              style={{ width: '100%', background: isLocked ? 'rgba(0,0,0,0.3)' : '#1e293b', border: '1px solid var(--border-dark)', borderRadius: '8px', padding: '10px 14px', color: 'white', opacity: isLocked ? 0.6 : 1, cursor: isLocked ? 'not-allowed' : 'text' }}
                            />
                            {!isLocked && (
                              <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.8rem', marginTop: '6px' }}>
                                ⚠️ <strong>تنبيه هام للرفع على جوجل درايف:</strong> تأكد من تعديل إعدادات المشاركة لتجعل الرابط <strong>"متاح لأي شخص لديه الرابط" (Anyone with the link can view)</strong> ليتمكن المسؤول من قراءته.
                              </p>
                            )}
                          </div>

                          <div className="cd-answer-actions" style={{ marginTop: '15px' }}>
                            {q.my_answer?.answer_link && (
                              <a href={q.my_answer.answer_link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontSize: '0.88rem' }}>
                                🔗 عرض الرابط المرسل سابقاً
                              </a>
                            )}
                            {!isLocked && (
                              <button
                                className="cd-btn cd-btn-purple cd-btn-sm"
                                onClick={() => handleSubmitAnswer(q.id)}
                                disabled={submittingAnswer === q.id}
                                style={{ marginRight: 'auto' }}
                              >
                                {submittingAnswer === q.id ? 'جاري الإرسال...' : '📤 إرسال الإجابة'}
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
          )}

          {activeTab === 'files' && (
            <div className="cd-tab-content">
              {cardFiles.length === 0 ? (
                <div className="cd-empty"><p>📁 لا توجد ملفات شرح مضافة لهذا الدرس بعد.</p></div>
              ) : (
                <div className="cd-files-container">
                  <h3 className="cd-section-title">📁 ملفات الشرح والمستندات المرفقة بالدرس:</h3>
                  <div className="cd-files-grid">
                    {cardFiles.map((file) => (
                      <div key={file.id} className="cd-file-card">
                        <div className="cd-file-icon-box">
                          <span className="cd-file-icon">📄</span>
                        </div>
                        <div className="cd-file-details">
                          <h4 className="cd-file-title">{file.title}</h4>
                          <p className="cd-file-sub">رابط مستند شرح (Google Drive / PDF)</p>
                        </div>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cd-file-action-btn"
                        >
                          فتح الملف ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// =============================================
// Certificate Panel Component
// =============================================
function CertificatePanel({ certStatus, courseId, token, claimingCert, setClaimingCert, certPdfLoading, setCertPdfLoading, apiService, onCertIssued, navigate }) {
  const [hasClickedShow, setHasClickedShow] = useState(certStatus?.status === 'issued');
  const [checking, setChecking] = useState(false);

  if (!certStatus) {
    return (
      <div className="cd-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#9ca3af' }}>جاري فحص بيانات الشهادة...</p>
      </div>
    );
  }

  const { status, eligible, checklist, calculated_score, calculated_grade, time_spent_formatted, exams_avg_score, review_deductions, certificate, message } = certStatus;

  const handleCheckAndShowCertificate = async () => {
    setChecking(true);
    try {
      const freshStatus = await apiService.getCourseCertificateStatus(courseId, token);
      setHasClickedShow(true);

      const getEnglishGrade = (grade, score) => {
        if (score >= 90) return 'Excellent with Honors';
        if (score >= 80) return 'Very Good';
        if (score >= 65) return 'Good';
        if (score >= 50) return 'Pass';
        return grade && !grade.includes('ممتاز') && !grade.includes('جيد') ? grade : 'Satisfactory';
      };

      const formatDateEn = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      };

      if (freshStatus.status === 'issued') {
        onCertIssued(freshStatus);
        return;
      }

      if (freshStatus.eligible) {
        setClaimingCert(true);
        try {
          const cert = await apiService.claimCourseCertificate(courseId, token);
          onCertIssued({
            ...freshStatus,
            status: 'issued',
            eligible: true,
            certificate: cert,
            message: 'تهانينا! تم إصدار شهادتك الرسمية بنجاح 🎉'
          });
        } catch (claimErr) {
          onCertIssued(freshStatus);
        } finally {
          setClaimingCert(false);
        }
      } else {
        onCertIssued(freshStatus);
      }
    } catch (err) {
      alert(err?.response?.data?.detail || 'تعذر التحقق من متطلبات الشهادة حالياً.');
    } finally {
      setChecking(false);
    }
  };

  const handleClaimManual = async () => {
    setClaimingCert(true);
    try {
      const cert = await apiService.claimCourseCertificate(courseId, token);
      onCertIssued({
        ...certStatus,
        status: 'issued',
        eligible: true,
        certificate: cert,
        message: 'تم إصدار شهادتك بنجاح ، تهانينا 🎉'
      });
    } catch (e) {
      alert(e?.response?.data?.detail || 'تعذر إصدار الشهادة.');
    } finally {
      setClaimingCert(false);
    }
  };

  const handleDownloadPDF = async () => {
    const cert = certificate;
    if (!cert) return;
    setCertPdfLoading(true);
    try {
      const { generateCertificatePDF } = await import('../utils/generateCertificatePDF.js');
      await generateCertificatePDF(cert);
    } catch (e) {
      alert('تعذر توليد الشهادة بصيغة PDF.');
    } finally {
      setCertPdfLoading(false);
    }
  };

  const getEnglishGrade = (grade, score) => {
    if (score >= 90) return 'Excellent with Honors';
    if (score >= 80) return 'Very Good';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Pass';
    return grade && !grade.includes('ممتاز') && !grade.includes('جيد') ? grade : 'Satisfactory';
  };

  const formatDateEn = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const scoreColor = calculated_score >= 90 ? '#fbbf24' : calculated_score >= 80 ? '#34d399' : calculated_score >= 65 ? '#60a5fa' : '#f87171';

  // 1. Initial State before clicking "إظهار الشهادة" (when not already issued)
  if (status !== 'issued' && !hasClickedShow) {
    return (
      <div className="cd-container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.12) 0%, rgba(234, 179, 8, 0.03) 100%)',
          border: '2px solid rgba(250, 204, 21, 0.4)',
          borderRadius: '24px',
          padding: '45px 30px',
          boxShadow: '0 0 35px rgba(250, 204, 21, 0.15)'
        }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(250,204,21,0.5))' }}>🎓</div>
          <span style={{
            background: 'rgba(250, 204, 21, 0.2)',
            color: '#facc15',
            padding: '4px 16px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            letterSpacing: '0.05em'
          }}>
            ExamPF OFFICIAL CERTIFICATE
          </span>
          <h2 style={{ color: 'white', fontSize: '1.9rem', fontWeight: '900', margin: '16px 0 10px 0' }}>
            شهادة إتمام الكورس المعتمدة
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.8', maxWidth: '620px', margin: '0 auto 30px auto' }}>
            انقر على زر <b>إظهار الشهادة</b> أدناه للتحقق التلقائي من جميع متطلبات الكورس (إكمال الكروت والدروس، حل جميع الأسئلة المقالية، اجتياز الاختبارات وتسليم المشاريع). 
            إذا كانت المتطلبات مستوفاة ستظهر شهادتك الرسمية فوراً، وإن كان ينقصك أي متطلب سنعرض لك بالتفصيل ما عليك إكماله.
          </p>

          <button
            onClick={handleCheckAndShowCertificate}
            disabled={checking || claimingCert}
            style={{
              background: 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)',
              color: '#000',
              border: 'none',
              padding: '16px 42px',
              borderRadius: '16px',
              fontSize: '1.2rem',
              fontWeight: '900',
              cursor: (checking || claimingCert) ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 25px rgba(250, 204, 21, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            {checking ? '⏳ جاري فحص المتطلبات...' : claimingCert ? '⏳ جاري إصدار الشهادة...' : '🎓 إظهار الشهادة والتحقق من المتطلبات'}
          </button>
        </div>
      </div>
    );
  }

  // 2. Render Panel (Either Certificate is Issued OR Ineligible Breakdown)
  return (
    <div className="cd-container">

      {/* Score Overview Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(234,179,8,0.04) 100%)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ color: '#facc15', fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>🎓 شهادة إتمام الكورس</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '6px 0 0 0' }}>{message}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.8rem', fontWeight: '900', color: scoreColor, lineHeight: 1 }}>{calculated_score}%</div>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>{calculated_grade}</div>
          </div>
        </div>

        {/* Score breakdown tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '20px' }}>
          {[{
            icon: '⏱️', label: 'مدة الدراسة', value: time_spent_formatted || '1 Day'
          }, {
            icon: '📝', label: 'متوسط الامتحانات', value: `${exams_avg_score}%`
          }, {
            icon: '📄', label: 'إجابات الأسئلة', value: `${checklist?.answered_questions || 0}/${checklist?.total_questions || 0}`
          }, {
            icon: '✅', label: 'إكمال الكروت', value: `${checklist?.completed_cards || 0}/${checklist?.total_cards || 0}`
          }].map((item, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{item.icon}</div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>{item.value}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '2px' }}>{item.label}</div>
            </div>
          ))}
        </div>

        {review_deductions > 0 && (
          <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.84rem', color: '#fca5a5' }}>
            ⚠️ تم خصم {review_deductions}% بسبب ملاحظات المراجعة على بعض إجاباتك.
          </div>
        )}
      </div>

      {/* --- Case A: Certificate Is Issued (Official English Luxury Diploma Style - NO BOXES) --- */}
      {status === 'issued' && certificate ? (
        <div style={{ marginBottom: '30px' }}>
          
          {/* Certificate Canvas / Card */}
          <div dir="ltr" style={{
            background: '#ffffff',
            color: '#0f172a',
            border: '4px solid #0f172a',
            borderRadius: '12px',
            padding: '36px 36px 28px 36px',
            position: 'relative',
            boxShadow: '0 15px 45px rgba(0, 0, 0, 0.45)',
            overflow: 'hidden',
            fontFamily: "'Montserrat', 'Segoe UI', Tahoma, sans-serif"
          }}>
            {/* Inner Gold Foil Borders */}
            <div style={{ position: 'absolute', inset: '8px', border: '1.5px solid #d4af37', borderRadius: '8px', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: '12px', border: '1px solid rgba(212, 175, 55, 0.35)', borderRadius: '6px', pointerEvents: 'none' }} />

            {/* Corner Accents */}
            <div style={{ position: 'absolute', top: '14px', left: '14px', width: '24px', height: '24px', borderTop: '3px solid #d4af37', borderLeft: '3px solid #d4af37' }} />
            <div style={{ position: 'absolute', top: '14px', right: '14px', width: '24px', height: '24px', borderTop: '3px solid #d4af37', borderRight: '3px solid #d4af37' }} />
            <div style={{ position: 'absolute', bottom: '14px', left: '14px', width: '24px', height: '24px', borderBottom: '3px solid #d4af37', borderLeft: '3px solid #d4af37' }} />
            <div style={{ position: 'absolute', bottom: '14px', right: '14px', width: '24px', height: '24px', borderBottom: '3px solid #d4af37', borderRight: '3px solid #d4af37' }} />

            {/* Certificate Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid rgba(212, 175, 55, 0.35)', paddingBottom: '14px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Credential ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#b8860b', fontWeight: '800', fontSize: '0.9rem' }}>{certificate.certificate_code}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'serif', fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.12em', lineHeight: 1.1 }}>
                  EXAMPF ACADEMY
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b8860b', fontWeight: '700', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Accredited Online Examination & Learning Platform
                </div>
              </div>
            </div>

            {/* Title Block */}
            <div style={{ textAlign: 'center', margin: '14px 0 10px 0' }}>
              <h2 style={{ fontFamily: 'serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Certificate of Achievement
              </h2>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#d4af37', letterSpacing: '0.22em', marginTop: '4px', textTransform: 'uppercase' }}>
                Official Certificate of Academic Completion
              </div>
              <div style={{ width: '220px', height: '2px', background: 'linear-gradient(90deg, transparent, #d4af37, #0f172a, #d4af37, transparent)', margin: '10px auto' }} />
            </div>

            {/* Recipient */}
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 6px 0', fontWeight: '600' }}>
                This is to certify that
              </p>
              <div style={{ display: 'inline-block', padding: '4px 36px', borderBottom: '2.5px solid #d4af37', marginBottom: '8px' }}>
                <span style={{ fontSize: 'clamp(1.7rem, 4.2vw, 2.4rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '0.02em' }}>
                  {certificate.student_name}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '8px 0 4px 0', fontWeight: '600', maxWidth: '650px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                has successfully completed and fulfilled all academic requirements, evaluations, and coursework for:
              </p>
              <h3 style={{ fontSize: 'clamp(1.3rem, 3.2vw, 1.8rem)', fontWeight: '900', color: '#1e3a8a', margin: '6px 0 18px 0' }}>
                {certificate.course_title}
              </h3>
            </div>

            {/* Clean Typography Credentials Line (NO BOXES) */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'clamp(12px, 3.5vw, 36px)',
              margin: '0 auto 22px auto',
              maxWidth: '780px',
              padding: '12px 0',
              borderTop: '1px solid rgba(212, 175, 55, 0.25)',
              borderBottom: '1px solid rgba(212, 175, 55, 0.25)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: '900', color: certificate.final_score >= 90 ? '#b8860b' : certificate.final_score >= 80 ? '#15803d' : '#1d4ed8', display: 'block', lineHeight: 1.2 }}>
                  {certificate.final_score}%
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px', display: 'block' }}>
                  Final Score
                </span>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(212, 175, 55, 0.35)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                  {getEnglishGrade(certificate.final_grade, certificate.final_score)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px', display: 'block' }}>
                  Academic Standing
                </span>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(212, 175, 55, 0.35)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0284c7', display: 'block', lineHeight: 1.2 }}>
                  {certificate.time_spent_formatted || '1 Day'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px', display: 'block' }}>
                  Course Duration
                </span>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(212, 175, 55, 0.35)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                  {formatDateEn(certificate.issued_at)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px', display: 'block' }}>
                  Date of Issuance
                </span>
              </div>
            </div>

            {/* Footer with Signatures & Seal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '16px' }}>
              {/* Verification Info (Left) */}
              <div style={{ textAlign: 'left', direction: 'ltr', fontSize: '0.75rem', color: '#475569', minWidth: '180px' }}>
                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.8rem', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Official Verification Portal</div>
                <div>Verify credential authenticity at:</div>
                <div style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '700' }}>
                  exampf.vercel.app/verify-certificate
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px' }}>Secured by ExamPF Integrity Engine</div>
              </div>

              {/* Center Seal */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  background: 'radial-gradient(circle, #fef08a 0%, #eab308 60%, #ca8a04 100%)',
                  border: '3px solid #a16207',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(161, 98, 7, 0.35)'
                }}>
                  <div style={{ width: '54px', height: '54px', border: '1px dashed #713f12', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🎓</span>
                    <span style={{ fontSize: '6px', fontWeight: '900', color: '#713f12', letterSpacing: '0.1em' }}>VERIFIED</span>
                    <span style={{ fontSize: '6px', fontWeight: '900', color: '#713f12', letterSpacing: '0.1em' }}>EXAMPF</span>
                  </div>
                </div>
              </div>

              {/* Signature (Right) */}
              <div style={{ textAlign: 'right', minWidth: '180px' }}>
                <div style={{ fontFamily: 'cursive, sans-serif', fontSize: '1.6rem', color: '#1e3a8a', fontWeight: 'bold', transform: 'rotate(-2deg)', marginBottom: '4px' }}>
                  ExamPF Academic Board
                </div>
                <div style={{ width: '150px', height: '1px', background: '#94a3b8', margin: '0 0 4px auto' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>Academic Affairs & Verification Board</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Examination & Evaluation Committee</div>
              </div>
            </div>

          </div>

          {/* Action Buttons Below Certificate */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
            <button
              onClick={handleDownloadPDF}
              disabled={certPdfLoading}
              style={{
                background: 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)',
                border: 'none',
                color: '#000',
                padding: '14px 34px',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '1.05rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(250, 204, 21, 0.35)'
              }}
            >
              {certPdfLoading ? '⏳ جاري التوليد...' : '📄 تحميل الشهادة PDF (A4 رسمي)'}
            </button>
            <a
              href={`/verify-certificate?code=${certificate.certificate_code}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🔗 صفحة التحقق العامة
            </a>
            <button
              onClick={handleCheckAndShowCertificate}
              disabled={checking}
              style={{
                background: 'transparent',
                border: '1px solid rgba(250,204,21,0.4)',
                color: '#facc15',
                padding: '14px 24px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              {checking ? '⏳...' : '🔄 إعادة فحص السجل والدرجات'}
            </button>
          </div>
        </div>
      ) : eligible ? (
        /* --- Case B: Eligible but not yet claimed --- */
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '28px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
          <h3 style={{ color: '#34d399', fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>مبروك عليك! لقد استوفيت جميع المتطلبات!</h3>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>درجتك المحسوبة في الكورس: <strong style={{ color: '#34d399', fontSize: '1.2rem' }}>{calculated_score}%</strong> — {calculated_grade}</p>
          <button
            onClick={handleClaimManual}
            disabled={claimingCert}
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', border: 'none', color: '#000', padding: '14px 38px', borderRadius: '12px', fontWeight: '900', fontSize: '1.15rem', cursor: 'pointer' }}
          >
            {claimingCert ? '⏳ جاري إصدار الشهادة...' : '🎓 استلم شهادتك الآن!'}
          </button>
        </div>
      ) : (
        /* --- Case C: Ineligible - Detailed Breakdown of Missing Items --- */
        <div style={{ marginBottom: '30px' }}>
          
          {/* Header notice */}
          <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.05) 100%)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '16px', padding: '22px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ color: '#f87171', fontSize: '1.3rem', fontWeight: '800', margin: '0 0 6px 0' }}>
              لا يمكن إظهار الشهادة حالياً — لم تستوفِ كافة المتطلبات بعد
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', margin: 0 }}>
              يجب إكمال كافة البنود الموضحة أدناه ليتم فتح الشهادة وتوثيقها رسمياً.
            </p>
            <button
              onClick={handleCheckAndShowCertificate}
              disabled={checking}
              style={{
                marginTop: '15px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {checking ? '⏳ جاري إعادة الفحص...' : '🔄 إعادة التحقق من المتطلبات الآن'}
            </button>
          </div>

          {/* High-level Summary Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'كروت الكورس المكتملة', done: (checklist?.missing_cards?.length || 0) === 0, detail: `${checklist?.completed_cards || 0}/${checklist?.total_cards || 0}` },
              { label: 'أسئلة الكروت المجاب عليها', done: (checklist?.missing_questions?.length || 0) === 0 && (checklist?.retry_questions?.length || 0) === 0, detail: `${checklist?.answered_questions || 0}/${checklist?.total_questions || 0}` },
              { label: 'الامتحانات المجتازة', done: (checklist?.missing_exams?.length || 0) === 0, detail: `${checklist?.taken_exams || 0}/${checklist?.total_exams || 0}` },
              ...(checklist?.total_projects > 0 ? [{ label: 'المشاريع المسلمة', done: (checklist?.missing_projects?.length || 0) === 0, detail: `${checklist?.submitted_projects || 0}/${checklist?.total_projects || 0}` }] : [])
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: item.done ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${item.done ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.done ? '✅' : '❌'}</span>
                  <span style={{ color: item.done ? '#34d399' : '#f87171', fontWeight: '600', fontSize: '0.85rem' }}>{item.label}</span>
                </div>
                <span style={{ color: item.done ? '#34d399' : '#f87171', fontWeight: 'bold', fontSize: '0.85rem', fontFamily: 'monospace' }}>{item.detail}</span>
              </div>
            ))}
          </div>

          {/* 1. Missing Cards List */}
          {checklist?.missing_cards && checklist.missing_cards.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>📌</span>
                <h4 style={{ color: '#f87171', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>
                  الكروت والدروس غير المكتملة ({checklist.missing_cards.length})
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklist.missing_cards.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '8px' }}>خطوة #{c.order}</span>
                      <strong style={{ color: 'white', fontSize: '0.92rem' }}>{c.title}</strong>
                    </div>
                    {navigate && (
                      <button
                        onClick={() => navigate(`/course/${courseId}/card/${c.id}`)}
                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        انتقل للدرس ←
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Missing Questions List */}
          {checklist?.missing_questions && checklist.missing_questions.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>❓</span>
                <h4 style={{ color: '#f87171', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>
                  أسئلة الكروت التي لم تُجب عليها ({checklist.missing_questions.length})
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklist.missing_questions.map((q) => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: '#38bdf8', fontSize: '0.8rem', display: 'block', marginBottom: '2px' }}>
                        في كارت: {q.card_title || 'درس'} (خطوة #{q.card_order || '—'})
                      </span>
                      <strong style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>{q.question_text}</strong>
                    </div>
                    {navigate && (
                      <button
                        onClick={() => navigate(`/course/${courseId}/card/${q.card_id}`)}
                        style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        حل السؤال ←
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Retry Questions (Feedback requiring update) */}
          {checklist?.retry_questions && checklist.retry_questions.length > 0 && (
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔄</span>
                <h4 style={{ color: '#fbbf24', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>
                  أسئلة طلب المعلم مراجعتها وتعديل الإجابة ({checklist.retry_questions.length})
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklist.retry_questions.map((r) => (
                  <div key={r.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>في كارت: {r.card_title || 'درس'}</span>
                      {navigate && r.card_id && (
                        <button
                          onClick={() => navigate(`/course/${courseId}/card/${r.card_id}`)}
                          style={{ background: '#f59e0b', color: '#000', fontWeight: 'bold', border: 'none', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          تعديل الإجابة ←
                        </button>
                      )}
                    </div>
                    <div style={{ color: 'white', fontSize: '0.9rem', marginBottom: '4px' }}>{r.question_text}</div>
                    <div style={{ color: '#fca5a5', fontSize: '0.82rem', background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                      💬 ملاحظة المعلم: {r.admin_feedback}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Missing Exams */}
          {checklist?.missing_exams && checklist.missing_exams.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>📝</span>
                <h4 style={{ color: '#f87171', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>
                  الاختبارات التي لم يتم اجتيازها ({checklist.missing_exams.length})
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklist.missing_exams.map((ex) => (
                  <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ color: 'white', fontSize: '0.92rem' }}>{ex.title}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginRight: '8px' }}>({ex.code || 'اختبار'})</span>
                    </div>
                    {navigate && (
                      <button
                        onClick={() => navigate(`/register-student/${ex.id}`)}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        بدء الاختبار ←
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Missing Projects */}
          {checklist?.missing_projects && checklist.missing_projects.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏗️</span>
                <h4 style={{ color: '#f87171', fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>
                  مشاريع لم تسلم أو بانتظار الاعتماد ({checklist.missing_projects.length})
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {checklist.missing_projects.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                    <strong style={{ color: 'white', fontSize: '0.92rem' }}>{p.title}</strong>
                    {navigate && (
                      <button
                        onClick={() => navigate(`/course/${courseId}/card/${p.id}`)}
                        style={{ background: '#f59e0b', color: '#000', fontWeight: 'bold', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        صفحة المشروع ←
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
