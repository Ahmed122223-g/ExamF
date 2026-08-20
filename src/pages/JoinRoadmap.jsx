import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  FaArrowRight, FaRocket, FaKey, FaTelegramPlane,
  FaExternalLinkAlt, FaCheckCircle
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import './StudentRoadmapView.css';

const JoinRoadmap = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('student_token');

  const [availableRoadmaps, setAvailableRoadmaps] = useState([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('');
  const [roadmapCode, setRoadmapCode] = useState('');
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const fetchRoadmaps = async () => {
      try {
        setLoadingRoadmaps(true);
        const data = await apiService.getAvailableRoadmaps(token);
        setAvailableRoadmaps(data || []);
        if (data && data.length > 0) setSelectedRoadmapId(data[0].id.toString());
      } catch (err) {
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
      Swal.fire('تنبيه', 'يرجى اختيار المسار وإدخال كود الاشتراك.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiService.joinRoadmap(parseInt(selectedRoadmapId), roadmapCode.trim(), token);
      Swal.fire({
        icon: 'success',
        title: 'مبروك! تم الانضمام للمسار 🎉',
        text: res.message || 'تم تفعيل اشتراكك بنجاح.',
        confirmButtonText: 'الدخول للمسار الآن 🚀'
      }).then(() => navigate(`/roadmap/${selectedRoadmapId}`));
    } catch (err) {
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
    <div className="jrm-page">

      {/* Back button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="srm-back-btn"
        >
          <FaArrowRight /> العودة للوحة التحكم
        </button>
      </div>

      {/* Hero Banner */}
      <div className="jrm-hero">
        <div className="jrm-hero-inner">
          <div className="jrm-hero-icon"><FaRocket /></div>
          <div>
            <h1>الانضمام إلى مسار تعليمي (Roadmap)</h1>
            <p>
              اختر المسار التعليمي وأدخل كود الوصول المخصص له للبدء في دراسة المراحل والمقالات والكورسات التفاعلية.
            </p>
          </div>
        </div>
      </div>

      {loadingRoadmaps ? (
        <div className="srm-loading">
          <div className="spinner" />
          <span>جاري تحميل المسارات المتاحة...</span>
        </div>
      ) : availableRoadmaps.length === 0 ? (
        <div className="jrm-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '1.1rem', color: '#64748b' }}>لا توجد مسارات تعليمية متاحة حالياً.</p>
          <button onClick={() => navigate('/dashboard')} className="srm-btn-complete" style={{ maxWidth: 200, marginTop: 16 }}>
            العودة للرئيسية
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* Step 1: Select Roadmap */}
          <div className="jrm-section">
            <div className="jrm-section-title">
              <span className="jrm-step-num">1</span>
              اختر المسار التعليمي المراد الانضمام إليه:
            </div>

            <div className="jrm-roadmap-grid">
              {availableRoadmaps.map((rm) => {
                const isSelected = selectedRoadmapId.toString() === rm.id.toString();
                return (
                  <div
                    key={rm.id}
                    className={`jrm-rm-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedRoadmapId(rm.id.toString())}
                  >
                    <div className="jrm-rm-card-head">
                      <span className="jrm-rm-id">مسار #{rm.id}</span>
                      {isSelected && <FaCheckCircle style={{ color: '#34d399', fontSize: '1.05rem' }} />}
                    </div>
                    <p className="jrm-rm-title">🗺️ {rm.title}</p>
                    <p className="jrm-rm-desc">
                      {rm.description || 'مسار متكامل لتعلم المفاهيم والتطبيقات.'}
                    </p>
                    <div className="jrm-rm-stats">
                      <span>📍 {rm.stages_count} مراحل</span>
                      <span>📚 {rm.items_count} كارت</span>
                      {rm.is_enrolled && (
                        <span style={{ color: '#34d399', fontWeight: 700 }}>✓ مسجل</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Summary */}
          {selectedRoadmap && (
            <div className="jrm-selected-summary" style={{ marginBottom: 22 }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.83rem' }}>المسار المحدد حالياً:</div>
                <div style={{ color: '#d8b4fe', fontWeight: 700, fontSize: '1.05rem', marginTop: 2 }}>
                  🗺️ {selectedRoadmap.title}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: '0.83rem', color: '#38bdf8' }}>
                <span>{selectedRoadmap.stages_count} مراحل</span>
                <span>{selectedRoadmap.items_count} كارت تفاعلي</span>
              </div>
            </div>
          )}

          {/* Step 2: Code Input */}
          <div className="jrm-section">
            <div className="jrm-section-title">
              <span className="jrm-step-num">2</span>
              أدخل كود الاشتراك الخاص بهذا المسار (10 خانات):
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 18, lineHeight: 1.6 }}>
              يتكون الكود من 10 خانات عشوائية (أرقام وحروف كابيتال واسمول)، وصلاحيته شهر كامل (30 يوماً) من تاريخ الاستخدام.
            </p>
            <div className="jrm-code-wrap">
              <input
                type="text"
                className="jrm-code-input"
                value={roadmapCode}
                onChange={(e) => setRoadmapCode(e.target.value)}
                placeholder="مثال: aB8xK9mQ2Z"
                maxLength={15}
                required
              />
              <FaKey style={{ position: 'absolute', top: '50%', right: 18, transform: 'translateY(-50%)', color: '#a855f7', fontSize: '1.1rem', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Step 3: Telegram CTA */}
          <div className="jrm-tg-box">
            <div>
              <div className="jrm-tg-text">
                <FaTelegramPlane style={{ marginLeft: 6, color: '#06b6d4' }} />
                ليس لديك كود اشتراك حتى الآن؟
              </div>
              <div className="jrm-tg-sub">
                يمكنك طلب كود الاشتراك الشهري الخاص بك فوراً وبشكل تلقائي عبر بوت التلجرام الرسمي للمنصة.
              </div>
            </div>
            <a
              href="https://t.me/admaghbot"
              target="_blank"
              rel="noopener noreferrer"
              className="jrm-tg-btn"
            >
              <FaTelegramPlane /> طلب كود عبر بوت التلجرام (@admaghbot) <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
            </a>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: 14 }}>
            <button
              type="submit"
              className="jrm-submit"
              disabled={submitting || !roadmapCode.trim() || !selectedRoadmapId}
            >
              {submitting ? 'جاري التحقق وتفعيل الاشتراك...' : 'تأكيد الانضمام وتفعيل المسار (30 يوماً) 🚀'}
            </button>
            <button
              type="button"
              className="srm-btn-secondary"
              onClick={() => navigate('/dashboard')}
              style={{ padding: '15px 24px', borderRadius: 14 }}
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
