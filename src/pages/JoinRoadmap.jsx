import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  FaArrowRight, FaRocket, FaKey, FaTelegramPlane, FaExternalLinkAlt, 
  FaCheckCircle, FaClock, FaLayerGroup, FaBookOpen, FaShieldAlt 
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const JoinRoadmap = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('student_token');

  const [availableRoadmaps, setAvailableRoadmaps] = useState([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const [roadmapCode, setRoadmapCode] = useState('');
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchRoadmaps = async () => {
      try {
        setLoadingRoadmaps(true);
        const data = await apiService.getAvailableRoadmaps(token);
        setAvailableRoadmaps(data || []);
        if (data && data.length > 0) {
          setSelectedRoadmapId(data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        Swal.fire('خطأ', 'فشل في تحميل قائمة المسارات التعليمية.', 'error');
      } finally {
        setLoadingRoadmaps(false);
      }
    };

    fetchRoadmaps();
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoadmapId || !roadmapCode.trim()) {
      Swal.fire('تنبيه', 'يرجى اختيار المسار وإدخال كود الاشتراك المكون من 10 خانات.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiService.joinRoadmap(parseInt(selectedRoadmapId), roadmapCode.trim(), token);
      Swal.fire({
        icon: 'success',
        title: 'مبروك! تم الانضمام للمسار 🎉',
        text: res.message || 'تم تفعيل اشتراكك بنجاح لمدة شهر (30 يوماً).',
        confirmButtonText: 'الدخول للمسار الآن 🚀'
      }).then(() => {
        navigate(`/roadmap/${selectedRoadmapId}`);
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'تعذر الانضمام',
        text: err.response?.data?.detail || 'كود الاشتراك غير صالح أو منتهي الصلاحية.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoadmap = availableRoadmaps.find(r => r.id.toString() === selectedRoadmapId?.toString());

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: 'clamp(20px, 4vw, 40px) clamp(15px, 3vw, 25px)',
      direction: 'rtl',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '10px', fontSize: '0.9rem' }}
        >
          <FaArrowRight /> العودة للوحة التحكم
        </button>

        <span style={{ fontSize: '0.82rem', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', padding: '4px 14px', borderRadius: '50px', fontWeight: 'bold' }}>
          اشتراك شهري (30 يوماً)
        </span>
      </div>

      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '30px',
        marginBottom: '30px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'rgba(139, 92, 246, 0.25)',
            color: '#c084fc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem'
          }}>
            <FaRocket />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.85rem)', color: 'white', fontWeight: 'bold', margin: 0 }}>
              الانضمام إلى مسار تعليمي (Roadmap)
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              اختر المسار التعليمي وأدخل كود الوصول المخصص له للبدء في دراسة المراحل والمقالات والكورسات.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Form */}
      {loadingRoadmaps ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner"></div>
          <p style={{ color: '#94a3b8', marginTop: '15px' }}>جاري تحميل المسارات المتاحة...</p>
        </div>
      ) : availableRoadmaps.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>لا توجد مسارات تعليمية متاحة حالياً.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ marginTop: '15px' }}>
            العودة للرئيسية
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Step 1: Select Roadmap */}
          <div className="glass-card" style={{ padding: '25px', borderRadius: '18px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#d8b4fe', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>1</span>
              اختر المسار التعليمي المراد الانضمام إليه:
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
              {availableRoadmaps.map((rm) => {
                const isSelected = selectedRoadmapId.toString() === rm.id.toString();
                return (
                  <div
                    key={rm.id}
                    onClick={() => setSelectedRoadmapId(rm.id.toString())}
                    style={{
                      padding: '18px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(139, 92, 246, 0.18)' : 'rgba(30, 41, 59, 0.5)',
                      border: `2px solid ${isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)'}`,
                      boxShadow: isSelected ? '0 0 20px rgba(139, 92, 246, 0.3)' : 'none',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.08)', color: '#cbd5e1', padding: '2px 8px', borderRadius: '4px' }}>
                          مسار #{rm.id}
                        </span>
                        {isSelected && (
                          <span style={{ color: '#34d399', fontSize: '1.1rem' }}>
                            <FaCheckCircle />
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                        🗺️ {rm.title}
                      </h3>
                      <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                        {rm.description || 'مسار متكامل لتعلم المفاهيم والتطبيقات.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', color: '#38bdf8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      <span>📍 {rm.stages_count} مراحل</span>
                      <span>📚 {rm.items_count} كارت</span>
                      {rm.is_enrolled && <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓ مسجل به</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Roadmap Highlight */}
          {selectedRoadmap && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>المسار المحدد حالياً:</span>
                <div style={{ color: '#d8b4fe', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '2px' }}>
                  🗺️ {selectedRoadmap.title}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#38bdf8' }}>
                <span>{selectedRoadmap.stages_count} مراحل تدريبية</span>
                <span>{selectedRoadmap.items_count} كارت تفاعلي</span>
              </div>
            </div>
          )}

          {/* Step 2: Access Code Input */}
          <div className="glass-card" style={{ padding: '25px', borderRadius: '18px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#d8b4fe', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>2</span>
              أدخل كود الاشتراك الخاص بهذا المسار (10 خانات):
            </h2>

            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', marginBottom: '15px' }}>
              يتكون الكود من 10 خانات عشوائية (أرقام وحروف كابيتال واسمول)، وصلاحيته شهر كامل (30 يوماً) من تاريخ الاستخدام.
            </p>

            <div style={{ position: 'relative', maxWidth: '420px', margin: '0 auto' }}>
              <input
                type="text"
                className="form-input"
                value={roadmapCode}
                onChange={(e) => setRoadmapCode(e.target.value)}
                placeholder="مثال: aB8xK9mQ2Z"
                maxLength={15}
                required
                style={{
                  background: '#1e293b',
                  color: 'white',
                  borderColor: 'rgba(139, 92, 246, 0.4)',
                  letterSpacing: '3px',
                  fontFamily: 'monospace',
                  fontSize: '1.3rem',
                  padding: '14px 45px 14px 20px',
                  textAlign: 'center',
                  borderRadius: '12px',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
                }}
              />
              <FaKey style={{ position: 'absolute', top: '18px', right: '18px', color: '#a855f7', fontSize: '1.2rem' }} />
            </div>
          </div>

          {/* Step 3: Telegram Bot Request Box */}
          <div className="glass-card" style={{
            padding: '24px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(6, 182, 212, 0.08))',
            border: '1px dashed rgba(6, 182, 212, 0.35)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '18px'
          }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '6px' }}>
                <FaTelegramPlane style={{ fontSize: '1.3rem', color: '#06b6d4' }} /> ليس لديك كود اشتراك حتى الآن؟
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: '1.6' }}>
                يمكنك طلب كود الاشتراك الشهري الخاص بك فوراً وبشكل تلقائي عبر بوت التلجرام الرسمي للمنصة.
              </p>
            </div>

            <a
              href="https://t.me/admaghbot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)'
              }}
            >
              <FaTelegramPlane style={{ fontSize: '1.1rem' }} /> طلب كود عبر بوت التلجرام (@admaghbot) <FaExternalLinkAlt style={{ fontSize: '0.8rem' }} />
            </a>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button
              type="submit"
              className="btn"
              disabled={submitting || !roadmapCode.trim() || !selectedRoadmapId}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                color: 'white',
                fontWeight: 'bold',
                padding: '15px',
                fontSize: '1.1rem',
                borderRadius: '14px',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.35)',
                cursor: (submitting || !roadmapCode.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'جاري التحقق وتفعيل الاشتراك...' : 'تأكيد الانضمام وتفعيل المسار (30 يوماً) 🚀'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
              style={{ padding: '15px 25px', borderRadius: '14px' }}
            >
              إلغاء
            </button>
          </div>

        </form>
      )}
    </div>
  );
};

export default JoinRoadmap;
