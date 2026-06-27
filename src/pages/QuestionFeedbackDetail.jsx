import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

export default function QuestionFeedbackDetail() {
  const { cardDbId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('student_token');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { navigate('/student/login'); return; }
    const load = async () => {
      try {
        const res = await apiService.getMyAnswerFeedback(cardDbId, token);
        setData(res || []);
      } catch {
        setError('تعذّر تحميل بيانات الملاحظات.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cardDbId, token]);

  const hasFeedback = data.some(q => q.admin_feedback);
  const hasAnswers  = data.some(q => q.my_answer_text || q.my_answer_link);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
      padding: 'clamp(16px,3vw,32px)',
      direction: 'rtl',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '8px', padding: 0 }}
        >
          ← العودة
        </button>
        <h1 style={{ color: 'white', margin: '0 0 4px', fontSize: 'clamp(1.3rem,4vw,2rem)', fontWeight: 800 }}>
          📋 ملاحظات الأدمن على إجاباتك
        </h1>
        <p style={{ color: '#9ca3af', margin: '0 0 28px', fontSize: 'clamp(0.8rem,2vw,0.92rem)' }}>
          مراجعة ملاحظات المسؤول على إجاباتك في أسئلة هذا الكارت
        </p>

        {/* Summary banner */}
        {!loading && !error && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>📝</span>
              <div>
                <p style={{ color: '#60a5fa', fontWeight: 700, margin: 0, fontSize: 'clamp(1rem,3vw,1.3rem)' }}>{data.length}</p>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.78rem' }}>إجمالي الأسئلة</p>
              </div>
            </div>
            <div style={{ background: hasFeedback ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${hasFeedback ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>💬</span>
              <div>
                <p style={{ color: hasFeedback ? '#10b981' : '#6b7280', fontWeight: 700, margin: 0, fontSize: 'clamp(1rem,3vw,1.3rem)' }}>
                  {data.filter(q => q.admin_feedback).length}
                </p>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.78rem' }}>ملاحظات مُرسلة</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '80px' }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
            <p style={{ margin: 0 }}>لا توجد أسئلة في هذا الكارت.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {data.map((q, idx) => (
              <div key={q.question_id} className="glass-card" style={{ padding: 'clamp(16px,3vw,24px)', borderRight: `4px solid ${q.admin_feedback ? '#10b981' : q.my_answer_text || q.my_answer_link ? '#3b82f6' : 'rgba(255,255,255,0.1)'}` }}>
                {/* Question number and text */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.82rem', display: 'block', marginBottom: '6px' }}>
                    سؤال {q.question_num}
                  </span>
                  {q.question_text ? (
                    <p style={{ color: '#e2e8f0', margin: 0, fontSize: 'clamp(0.88rem,2vw,1rem)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {q.question_text}
                    </p>
                  ) : q.question_image_url ? (
                    <a href={q.question_image_url} target="_blank" rel="noreferrer"
                      style={{ color: '#60a5fa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔗 رابط السؤال
                    </a>
                  ) : null}
                </div>

                {/* My Answer */}
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ color: '#6b7280', margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 600 }}>✏️ إجابتك:</p>
                  {q.my_answer_text ? (
                    <div style={{ background: 'rgba(59,130,246,0.07)', borderRadius: '10px', padding: '12px 14px', borderRight: '3px solid #3b82f6' }}>
                      <p style={{ color: '#c7d2fe', margin: 0, fontSize: 'clamp(0.85rem,2vw,0.95rem)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }}>
                        {q.my_answer_text}
                      </p>
                    </div>
                  ) : null}
                  {q.my_answer_link ? (
                    <a href={q.my_answer_link} target="_blank" rel="noreferrer"
                      style={{ color: '#60a5fa', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: q.my_answer_text ? '8px' : 0, wordBreak: 'break-all' }}>
                      🔗 {q.my_answer_link}
                    </a>
                  ) : null}
                  {!q.my_answer_text && !q.my_answer_link && (
                    <p style={{ color: '#4b5563', margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>لم تُرسل إجابة على هذا السؤال بعد.</p>
                  )}
                </div>

                {/* Admin Feedback */}
                {q.admin_feedback ? (
                  <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '10px', padding: '14px 16px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>💬</span>
                      <p style={{ color: '#10b981', fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>ملاحظة المسؤول</p>
                      {q.feedback_sent_at && (
                        <span style={{ color: '#6b7280', fontSize: '0.73rem', marginRight: 'auto' }}>
                          {new Date(q.feedback_sent_at).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#a7f3d0', margin: 0, fontSize: 'clamp(0.88rem,2vw,0.97rem)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.8 }}>
                      {q.admin_feedback}
                    </p>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 16px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#4b5563', fontSize: '0.85rem' }}>⏳ لم يتم إرسال ملاحظة على هذا السؤال بعد.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
