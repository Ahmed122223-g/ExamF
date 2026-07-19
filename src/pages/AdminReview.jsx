import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import Swal from 'sweetalert2';

export default function AdminReview() {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  const [activeTab, setActiveTab] = useState('projects');

  const [submissions, setSubmissions] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewGrade, setReviewGrade] = useState('');
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [cardsWithAnswers, setCardsWithAnswers] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    loadProjects();
    loadQuestions();
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const data = await apiService.getProjectSubmissionsAdmin(token);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { setSubmissions([]); }
    finally { setLoadingProjects(false); }
  };

  const loadQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const data = await apiService.getCardsWithAnswersAdmin(token);
      setCardsWithAnswers(Array.isArray(data) ? data : []);
    } catch { setCardsWithAnswers([]); }
    finally { setLoadingQuestions(false); }
  };

  const openReviewModal = (sub) => {
    setSelectedSub(sub);
    setReviewGrade(sub.grade ?? '');
    setReviewStatus(sub.status === 'pending' ? 'approved' : sub.status);
    setReviewFeedback(sub.feedback_note ?? '');
    setReviewModalOpen(true);
  };

  const submitProjectReview = async () => {
    if (!selectedSub) return;
    setSubmittingReview(true);
    try {
      await apiService.reviewProjectSubmissionAdmin(selectedSub.id, {
        status: reviewStatus,
        grade: reviewGrade !== '' ? Number(reviewGrade) : null,
        feedback_note: reviewFeedback
      }, token);
      setReviewModalOpen(false);
      await loadProjects();
      Swal.fire({ icon: 'success', title: 'تم', text: 'تمت المراجعة بنجاح!', background: '#1e293b', color: '#fff', timer: 1800, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل في حفظ المراجعة.', background: '#1e293b', color: '#fff' });
    } finally { setSubmittingReview(false); }
  };

  const openFeedbackModal = (answer, questionNum, cardTitle) => {
    setFeedbackModal({ answer, questionNum, cardTitle });
    setFeedbackText(answer.admin_feedback || '');
  };

  const submitFeedback = async () => {
    if (!feedbackModal || !feedbackText.trim()) return;
    setSendingFeedback(true);
    try {
      await apiService.sendAnswerFeedbackAdmin(feedbackModal.answer.answer_id, feedbackText.trim(), token);
      const savedName = feedbackModal.answer.student_name;
      setFeedbackModal(null);
      setFeedbackText('');
      await loadQuestions();
      Swal.fire({ icon: 'success', title: 'تم الإرسال', text: `تم إرسال الملاحظة وتنبيه الطالب ${savedName}`, background: '#1e293b', color: '#fff', timer: 2200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل في إرسال الملاحظة.', background: '#1e293b', color: '#fff' });
    } finally { setSendingFeedback(false); }
  };

  const statusBadge = (s) => {
    const map = {
      pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: '⏳ قيد المراجعة' },
      approved: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: '✓ مقبول' },
      rejected: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: '✗ مرفوض' }
    };
    const st = map[s] || map.pending;
    return <span style={{ background: st.bg, color: st.color, padding: '3px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700 }}>{st.label}</span>;
  };

  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const safeCardsWithAnswers = Array.isArray(cardsWithAnswers) ? cardsWithAnswers : [];

  const allAvailableCourses = Array.from(new Set([
    ...safeSubmissions.map(s => s.course_title).filter(Boolean),
    ...safeCardsWithAnswers.map(c => c.course_title).filter(Boolean)
  ]));

  const allAvailableSections = Array.from(new Set([
    ...safeSubmissions.filter(s => selectedCourse === 'all' || s.course_title === selectedCourse).map(s => s.section_title).filter(Boolean),
    ...safeCardsWithAnswers.filter(c => selectedCourse === 'all' || c.course_title === selectedCourse).map(c => c.section_title).filter(Boolean)
  ]));

  useEffect(() => {
    if (selectedSection !== 'all' && !allAvailableSections.includes(selectedSection)) {
      setSelectedSection('all');
    }
  }, [selectedCourse]);

  const filteredSubmissions = safeSubmissions.filter(s => {
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesCourse = selectedCourse === 'all' || s.course_title === selectedCourse;
    const matchesSection = selectedSection === 'all' || s.section_title === selectedSection;
    const matchesSearch = !searchQuery.trim() || 
      (s.card_title && s.card_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.student_name && s.student_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesCourse && matchesSection && matchesSearch;
  });

  const filteredCardsWithAnswers = safeCardsWithAnswers.filter(c => {
    const matchesCourse = selectedCourse === 'all' || c.course_title === selectedCourse;
    const matchesSection = selectedSection === 'all' || c.section_title === selectedSection;
    const matchesSearch = !searchQuery.trim() || 
      (c.card_title && c.card_title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCourse && matchesSection && matchesSearch;
  });

  const totalAnswers = filteredCardsWithAnswers.reduce((a, c) => a + (c.questions || []).reduce((b, q) => b + (q.answers || []).length, 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', padding: 'clamp(16px,3vw,32px)', direction: 'rtl', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '4px', padding: 0 }}>
            ← العودة للوحة التحكم
          </button>
          <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(1.3rem,4vw,2rem)', fontWeight: 800 }}>📋 مراجعة الطلاب</h1>
          <p style={{ color: '#9ca3af', margin: '4px 0 0', fontSize: 'clamp(0.8rem,2vw,0.92rem)' }}>مراجعة مشاريع الطلاب وإجاباتهم على أسئلة الكروت</p>
        </div>
      </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'projects', icon: '📁', label: 'المشاريع', count: safeSubmissions.length },
          { key: 'questions', icon: '❓', label: 'الأسئلة', count: safeCardsWithAnswers.reduce((a, c) => a + (c.questions || []).reduce((b, q) => b + (q.answers || []).length, 0), 0) }
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }} style={{
            padding: 'clamp(8px,1.5vw,12px) clamp(16px,3vw,24px)', borderRadius: '12px',
            border: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid rgba(255,255,255,0.1)',
            background: activeTab === tab.key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
            color: activeTab === tab.key ? '#60a5fa' : '#9ca3af', cursor: 'pointer', fontWeight: 700,
            fontSize: 'clamp(0.85rem,2vw,1rem)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {tab.icon} {tab.label}
            <span style={{ background: activeTab === tab.key ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)', borderRadius: '50px', padding: '1px 8px', fontSize: '0.75rem' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

            <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder={activeTab === 'projects' ? "🔍 ابحث باسم المشروع أو الطالب..." : "🔍 ابحث باسم الكارت / الواجب..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '500px' }}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">🎓 جميع الكورسات</option>
              {allAvailableCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15,23,42,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#fff',
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">📂 جميع الأقسام</option>
              {allAvailableSections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

            {activeTab === 'projects' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[{ v: 'all', l: 'الكل' }, { v: 'pending', l: '⏳ قيد المراجعة' }, { v: 'approved', l: '✓ مقبول' }, { v: 'rejected', l: '✗ مرفوض' }].map(f => (
              <button key={f.v} onClick={() => setFilterStatus(f.v)} style={{
                padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                background: filterStatus === f.v ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                color: filterStatus === f.v ? 'white' : '#9ca3af', transition: 'all 0.2s'
              }}>
                {f.l} ({f.v === 'all' ? safeSubmissions.length : safeSubmissions.filter(s => s.status === f.v).length})
              </button>
            ))}
          </div>
          {loadingProjects ? (
            <div style={{ textAlign: 'center', paddingTop: '60px' }}><div className="spinner" /></div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
              <p style={{ margin: 0 }}>لا توجد مشاريع في هذا التصنيف.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredSubmissions.map(sub => (
                <div key={sub.id} className="glass-card" style={{ padding: 'clamp(14px,2.5vw,22px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>📁 {sub.card_title}</span>
                        {sub.course_title && <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>🎓 {sub.course_title}</span>}
                        {sub.section_title && <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', padding: '2px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>📂 {sub.section_title}</span>}
                        {statusBadge(sub.status)}
                        {sub.grade != null && <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>🏆 {sub.grade}/100</span>}
                      </div>
                      <p style={{ color: 'white', fontWeight: 700, margin: '0 0 2px', fontSize: 'clamp(0.9rem,2.5vw,1rem)' }}>{sub.student_name}</p>
                      <p style={{ color: '#9ca3af', margin: '0 0 6px', fontSize: '0.8rem' }}>{sub.student_email}</p>
                      {sub.solution_text && (
                        <p style={{ color: '#d1d5db', margin: '8px 0 0', fontSize: '0.87rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                          {sub.solution_text.length > 200 ? sub.solution_text.slice(0, 200) + '...' : sub.solution_text}
                        </p>
                      )}
                      {sub.solution_link && (
                        <a href={sub.solution_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '8px', color: '#60a5fa', fontSize: '0.84rem', wordBreak: 'break-all', background: 'rgba(59,130,246,0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', textDecoration: 'none' }}>
                          🔗 فتح رابط المشروع
                        </a>
                      )}
                      {sub.feedback_note && (
                        <div style={{ marginTop: '8px', background: 'rgba(16,185,129,0.07)', padding: '8px 12px', borderRadius: '8px', borderRight: '3px solid #10b981' }}>
                          <p style={{ color: '#6ee7b7', margin: 0, fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>📝 {sub.feedback_note}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => openReviewModal(sub)} className="btn btn-primary" style={{ flexShrink: 0, fontSize: '0.85rem', padding: '9px 18px' }}>
                      {sub.status === 'pending' ? '✍️ مراجعة' : '✏️ تعديل'}
                    </button>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '10px 0 0' }}>
                    🕐 {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('ar-EG') : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

            {activeTab === 'questions' && (
        <>
          {loadingQuestions ? (
            <div style={{ textAlign: 'center', paddingTop: '60px' }}><div className="spinner" /></div>
          ) : filteredCardsWithAnswers.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
              <p style={{ margin: 0 }}>لم يتم العثور على أي أسئلة مطابقة للبحث أو الفلاتر.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredCardsWithAnswers.map(card => (
                <div key={card.card_id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <button
                    onClick={() => setExpandedCard(expandedCard === card.card_id ? null : card.card_id)}
                    style={{ width: '100%', padding: 'clamp(14px,2.5vw,20px)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.4rem' }}>📚</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: 'clamp(0.95rem,2.5vw,1.1rem)' }}>{card.card_title}</p>
                          {card.course_title && <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 600 }}>🎓 {card.course_title}</span>}
                          {card.section_title && <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', padding: '2px 8px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 600 }}>📂 {card.section_title}</span>}
                        </div>
                        <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.8rem' }}>
                          {card.questions.length} سؤال • {card.questions.reduce((a, q) => a + q.answers.length, 0)} إجابة
                        </p>
                      </div>
                    </div>
                    <span style={{ color: '#60a5fa', fontSize: '1.1rem', transition: 'transform 0.2s', transform: expandedCard === card.card_id ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>▼</span>
                  </button>

                  {expandedCard === card.card_id && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(12px,2vw,20px)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {card.questions.map(q => (
                        <div key={q.question_id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                          <button
                            onClick={() => setExpandedQuestion(expandedQuestion === q.question_id ? null : q.question_id)}
                            style={{ width: '100%', padding: 'clamp(10px,2vw,16px)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', textAlign: 'right' }}
                          >
                            <div style={{ flex: 1 }}>
                              <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>سؤال {q.question_num}</span>
                              {q.question_text && (
                                <p style={{ color: '#e2e8f0', margin: 0, fontSize: 'clamp(0.83rem,2vw,0.93rem)', whiteSpace: 'pre-wrap', lineHeight: 1.6, textAlign: 'right' }}>
                                  {q.question_text.length > 180 ? q.question_text.slice(0, 180) + '...' : q.question_text}
                                </p>
                              )}
                              {q.question_image_url && (
                                <a href={q.question_image_url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: '0.8rem' }}>🔗 رابط السؤال</a>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', padding: '2px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700 }}>
                                {q.answers.length} إجابة
                              </span>
                              <span style={{ color: '#60a5fa', fontSize: '1rem', transition: 'transform 0.2s', transform: expandedQuestion === q.question_id ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                            </div>
                          </button>

                          {expandedQuestion === q.question_id && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(10px,2vw,16px)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {q.answers.map(ans => (
                                <div key={ans.answer_id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: 'clamp(10px,2vw,16px)', border: ans.is_reviewed ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '0.92rem' }}>{ans.student_name}</p>
                                        {ans.is_reviewed ? (
                                          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '1px 8px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>✓ تم المراجعة</span>
                                        ) : (
                                          <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 8px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>⏳ لم يراجع</span>
                                        )}
                                      </div>
                                      <p style={{ color: '#9ca3af', margin: '0 0 8px', fontSize: '0.78rem' }}>{ans.student_email}</p>
                                      {ans.answer_text && (
                                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', borderRight: '3px solid #3b82f6' }}>
                                          <p style={{ color: '#d1d5db', margin: 0, fontSize: '0.87rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>{ans.answer_text}</p>
                                        </div>
                                      )}
                                      {ans.answer_link && (
                                        <a href={ans.answer_link} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: '0.85rem', display: 'block', marginBottom: '6px', wordBreak: 'break-all' }}>
                                          🔗 {ans.answer_link}
                                        </a>
                                      )}
                                      {ans.admin_feedback && (
                                        <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '8px 12px', borderRight: '3px solid #10b981', marginTop: '6px' }}>
                                          <p style={{ color: '#6ee7b7', margin: '0 0 2px', fontSize: '0.75rem', fontWeight: 700 }}>✅ ملاحظة مُرسلة:</p>
                                          <p style={{ color: '#a7f3d0', margin: 0, fontSize: '0.83rem', whiteSpace: 'pre-wrap' }}>{ans.admin_feedback}</p>
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                      {!ans.is_reviewed && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              await apiService.reviewAnswerAdmin(ans.answer_id, token);
                                              await loadQuestions();
                                              Swal.fire({ icon: 'success', title: 'تمت المراجعة', text: 'تم وضع علامة "تم المراجعة" وإخطار الطالب بنجاح.', background: '#1e293b', color: '#fff', timer: 1800, showConfirmButton: false });
                                            } catch {
                                              Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل في تحديث حالة المراجعة.', background: '#1e293b', color: '#fff' });
                                            }
                                          }}
                                          style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '9px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s' }}
                                        >
                                          ✓ تم المراجعة
                                        </button>
                                      )}
                                      <button
                                        onClick={() => openFeedbackModal(ans, q.question_num, card.card_title)}
                                        style={{ background: ans.admin_feedback ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: ans.admin_feedback ? '#10b981' : '#60a5fa', border: `1px solid ${ans.admin_feedback ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius: '9px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s' }}
                                      >
                                        {ans.admin_feedback ? '✏️ تعديل الملاحظة' : '💬 ملاحظة'}
                                      </button>
                                    </div>
                                  </div>
                                  <p style={{ color: '#4b5563', fontSize: '0.72rem', margin: '8px 0 0' }}>
                                    🕐 {ans.submitted_at ? new Date(ans.submitted_at).toLocaleString('ar-EG') : '—'}
                                    {ans.feedback_sent_at && <span style={{ marginRight: '10px', color: '#10b981' }}>• ملاحظة: {new Date(ans.feedback_sent_at).toLocaleDateString('ar-EG')}</span>}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

            {reviewModalOpen && selectedSub && (
        <div onClick={e => { if (e.target === e.currentTarget) setReviewModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(18px,3vw,28px)' }}>
            <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: 'clamp(1rem,3vw,1.2rem)' }}>✍️ مراجعة المشروع</h2>
            <p style={{ color: '#9ca3af', margin: '0 0 4px', fontSize: '0.85rem' }}>{selectedSub.student_name} — {selectedSub.card_title}</p>
            {(selectedSub.course_title || selectedSub.section_title) && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {selectedSub.course_title && <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>🎓 {selectedSub.course_title}</span>}
                {selectedSub.section_title && <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', padding: '2px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>📂 {selectedSub.section_title}</span>}
              </div>
            )}
            {selectedSub.solution_link && (
              <a href={selectedSub.solution_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '14px', color: '#60a5fa', fontSize: '0.87rem', background: 'rgba(59,130,246,0.1)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.25)', textDecoration: 'none', wordBreak: 'break-all' }}>
                🔗 فتح رابط المشروع
              </a>
            )}
            {selectedSub.solution_text && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', marginBottom: '18px', maxHeight: '150px', overflowY: 'auto', borderRight: '3px solid #3b82f6' }}>
                <p style={{ color: '#9ca3af', margin: '0 0 4px', fontSize: '0.75rem' }}>📝 الحل المُرسل:</p>
                <p style={{ color: '#e2e8f0', margin: 0, fontSize: '0.88rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedSub.solution_text}</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#d1d5db', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>الحالة</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ v: 'approved', l: '✓ قبول', c: '#10b981' }, { v: 'rejected', l: '✗ رفض', c: '#ef4444' }].map(opt => (
                    <button key={opt.v} onClick={() => setReviewStatus(opt.v)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${reviewStatus === opt.v ? opt.c : 'rgba(255,255,255,0.1)'}`, background: reviewStatus === opt.v ? `${opt.c}22` : 'rgba(255,255,255,0.03)', color: reviewStatus === opt.v ? opt.c : '#9ca3af', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ color: '#d1d5db', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>الدرجة (من 100)</label>
                <input type="number" min="0" max="100" value={reviewGrade} onChange={e => setReviewGrade(e.target.value)} placeholder="اترك فارغاً إذا لم تحدد درجة"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#d1d5db', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>ملاحظات للطالب</label>
                <textarea value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)} placeholder="اكتب ملاحظاتك للطالب..." rows={4}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.88rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.7 }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={submitProjectReview} disabled={submittingReview} className="btn btn-primary" style={{ flex: 1 }}>
                  {submittingReview ? '⏳ جاري الحفظ...' : '💾 حفظ المراجعة'}
                </button>
                <button onClick={() => setReviewModalOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontWeight: 600 }}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

            {feedbackModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setFeedbackModal(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: 'clamp(18px,3vw,28px)' }}>
            <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: 'clamp(1rem,3vw,1.2rem)' }}>💬 إرسال ملاحظة</h2>
            <p style={{ color: '#9ca3af', margin: '0 0 2px', fontSize: '0.85rem' }}>سؤال {feedbackModal.questionNum} — {feedbackModal.cardTitle}</p>
            <p style={{ color: '#60a5fa', margin: '0 0 18px', fontSize: '0.85rem', fontWeight: 600 }}>
              👤 {feedbackModal.answer.student_name} ({feedbackModal.answer.student_email})
            </p>
            {(feedbackModal.answer.answer_text || feedbackModal.answer.answer_link) && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', borderRight: '3px solid #3b82f6' }}>
                <p style={{ color: '#9ca3af', margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 600 }}>إجابة الطالب:</p>
                {feedbackModal.answer.answer_text && <p style={{ color: '#d1d5db', margin: '0 0 4px', fontSize: '0.87rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{feedbackModal.answer.answer_text}</p>}
                {feedbackModal.answer.answer_link && <a href={feedbackModal.answer.answer_link} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: '0.83rem', wordBreak: 'break-all' }}>🔗 {feedbackModal.answer.answer_link}</a>}
              </div>
            )}
            <label style={{ color: '#d1d5db', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>✍️ ملاحظتك</label>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="اكتب ملاحظتك هنا... (ستصل للطالب كتنبيه)" rows={5}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.7 }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={submitFeedback} disabled={sendingFeedback || !feedbackText.trim()} className="btn btn-primary" style={{ flex: 1, opacity: !feedbackText.trim() ? 0.5 : 1 }}>
                {sendingFeedback ? '⏳ جاري الإرسال...' : '📨 إرسال وتنبيه الطالب'}
              </button>
              <button onClick={() => setFeedbackModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontWeight: 600 }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
