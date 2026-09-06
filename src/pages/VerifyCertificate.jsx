import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';

  const [code, setCode] = useState(codeFromUrl);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (codeFromUrl) {
      handleVerify(codeFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (searchCode) => {
    const q = (searchCode || code).trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiService.verifyCertificate(q);
      setResult(data);
    } catch (e) {
      const detail = e?.response?.data?.detail;
      if (e?.response?.status === 404) {
        setError('❌ لم يتم العثور على شهادة بهذا الرمز. تأكد من صحة الكود.');
      } else {
        setError(detail || 'تعذر التحقق. يرجى المحاولة مجدداً.');
      }
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.final_score >= 90 ? '#fbbf24'
    : result.final_score >= 80 ? '#34d399'
    : result.final_score >= 65 ? '#60a5fa'
    : '#f87171'
    : '#fff';

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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #111130 50%, #0a1628 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'Tajawal, sans-serif' }} dir="rtl">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎓</div>
        <h1 style={{ color: '#facc15', fontSize: '2rem', fontWeight: '900', margin: 0 }}>التحقق من الشهادة</h1>
        <p style={{ color: '#9ca3af', marginTop: '8px', fontSize: '0.95rem' }}>أدخل رمز التحقق الفريد للشهادة للتحقق من صحتها</p>
        <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '6px' }}>Certificate Verification — ExamPF Platform</div>
      </div>

      {/* Search Box */}
      <div style={{ width: '100%', maxWidth: '560px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '28px' }}>
        <label style={{ color: '#e5e7eb', fontWeight: '700', fontSize: '0.9rem', display: 'block', marginBottom: '10px' }}>رمز التحقق من الشهادة</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            placeholder="EXAMC-XXXX-XXXX-XXXX-XXXX"
            style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '1rem', fontFamily: 'monospace', outline: 'none' }}
          />
          <button
            onClick={() => handleVerify()}
            disabled={loading || !code.trim()}
            style={{ background: loading ? 'rgba(250,204,21,0.5)' : 'linear-gradient(135deg, #facc15, #f59e0b)', border: 'none', color: '#000', padding: '12px 24px', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {loading ? '⌛ جاري التحقق...' : '🔍 تحقق'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ width: '100%', maxWidth: '560px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px 20px', color: '#f87171', fontWeight: '600', textAlign: 'center', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ width: '100%', maxWidth: '820px' }}>
          {/* Verified Badge Header */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', padding: '8px 24px', borderRadius: '20px', fontSize: '0.95rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span> شهادة رسمية مُعتمدة ومُتحقَّق من صحتها بالسجل الرقمي
            </span>
          </div>

          {/* Certificate Canvas / Card */}
          <div dir="ltr" style={{
            background: '#ffffff',
            color: '#0f172a',
            border: '4px solid #0f172a',
            borderRadius: '12px',
            padding: '36px 36px 28px 36px',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
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
                <span style={{ fontFamily: 'monospace', color: '#b8860b', fontWeight: '800', fontSize: '0.9rem' }}>{result.certificate_code}</span>
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
                  {result.student_name}
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '8px 0 4px 0', fontWeight: '600', maxWidth: '650px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                has successfully completed and fulfilled all academic requirements, evaluations, and coursework for:
              </p>
              <h3 style={{ fontSize: 'clamp(1.3rem, 3.2vw, 1.8rem)', fontWeight: '900', color: '#1e3a8a', margin: '6px 0 18px 0' }}>
                {result.course_title}
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
                <span style={{ fontSize: '1.45rem', fontWeight: '900', color: result.final_score >= 90 ? '#b8860b' : result.final_score >= 80 ? '#15803d' : '#1d4ed8', display: 'block', lineHeight: 1.2 }}>
                  {result.final_score}%
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px', display: 'block' }}>
                  Final Score
                </span>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(212, 175, 55, 0.35)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                  {getEnglishGrade(result.final_grade, result.final_score)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px', display: 'block' }}>
                  Academic Standing
                </span>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(212, 175, 55, 0.35)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0284c7', display: 'block', lineHeight: 1.2 }}>
                  {result.time_spent_formatted || '1 Day'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '3px', display: 'block' }}>
                  Course Duration
                </span>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(212, 175, 55, 0.35)' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                  {formatDateEn(result.issued_at)}
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
                    <span style={{ fontSize: '6.5px', fontWeight: '900', color: '#713f12', letterSpacing: '0.12em', marginTop: '1px' }}>VERIFIED</span>
                    <span style={{ fontSize: '6.5px', fontWeight: '900', color: '#713f12', letterSpacing: '0.12em' }}>EXAMPF</span>
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
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '32px', color: '#4b5563', fontSize: '0.8rem', textAlign: 'center' }}>
        منصة ExamPF التعليمية — جميع الحقوق محفوظة<br/>
        <a href="/" style={{ color: '#facc15', textDecoration: 'none', marginTop: '6px', display: 'inline-block' }}>← العودة إلى المنصة</a>
      </div>
    </div>
  );
}
