import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import Swal from 'sweetalert2';

export default function AdminStudents() {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Notification modal state
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTarget, setNotifTarget] = useState(null); // null = broadcast
  const [notifCourseId, setNotifCourseId] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [broadcast, setBroadcast] = useState(false);
  const [sending, setSending] = useState(false);

  // Courses list for broadcast selector
  const [allCourses, setAllCourses] = useState([]);

  // Sent notifications tab
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'sent'
  const [sentNotifs, setSentNotifs] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    fetchStudents();
    fetchCourses();
  }, [token]);

  const fetchStudents = async () => {
    try {
      const data = await apiService.getStudentsOverview(token);
      setStudents(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await apiService.getAdminCourses(token);
      setAllCourses(data);
    } catch (err) { console.error(err); }
  };

  const fetchSentNotifs = async () => {
    setLoadingSent(true);
    try {
      const data = await apiService.getSentNotificationsAdmin(token);
      setSentNotifs(data);
    } catch (err) { console.error(err); }
    finally { setLoadingSent(false); }
  };

  const openNotifModal = (student = null) => {
    setNotifTarget(student);
    setBroadcast(student === null);
    setNotifCourseId('');
    setNotifMessage('');
    setShowNotifModal(true);
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;
    setSending(true);
    try {
      const payload = {
        message: notifMessage.trim(),
        broadcast: broadcast,
        student_id: broadcast ? null : notifTarget?.id,
        course_id: notifCourseId ? parseInt(notifCourseId) : null,
      };
      const res = await apiService.sendNotification(payload, token);
      Swal.fire({ icon: 'success', title: 'تم الإرسال', text: res.message, timer: 2000, showConfirmButton: false });
      setShowNotifModal(false);
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في إرسال التنبيه', 'error');
    } finally { setSending(false); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-EG') : '—';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', direction: 'rtl' }}>
      {/* Navbar */}
      <nav style={{
        background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: 'clamp(10px,2vw,16px) clamp(14px,3vw,28px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(8px)',
        flexWrap: 'wrap', gap: '10px'
      }}>
        <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 'clamp(0.85rem,2vw,1rem)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← لوحة التحكم
        </Link>
        <span style={{ fontWeight: 800, fontSize: 'clamp(1rem,3vw,1.3rem)', color: 'white' }}>
          👥 إدارة الطلاب والتنبيهات
        </span>
        <button
          onClick={() => openNotifModal(null)}
          className="btn btn-accent"
          style={{ fontSize: 'clamp(0.8rem,2vw,0.9rem)', padding: '9px 16px' }}
        >
          📢 إرسال للجميع
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(14px,3vw,30px) clamp(12px,3vw,20px)' }}>

        {/* Tabs */}
        <div className="admin-tabs" style={{ marginBottom: '24px' }}>
          {[
            { key: 'students', label: `👥 الطلاب (${students.length})` },
            { key: 'sent', label: '📨 التنبيهات المرسلة' },
          ].map(t => (
            <button
              key={t.key}
              className="admin-tab-btn"
              onClick={() => {
                setActiveTab(t.key);
                if (t.key === 'sent' && sentNotifs.length === 0) fetchSentNotifs();
              }}
              style={{
                background: activeTab === t.key ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                color: 'white', border: 'none', cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Students Tab ── */}
        {activeTab === 'students' && (
          <>
            {/* Search */}
            <div style={{ marginBottom: '20px' }}>
              <input
                className="form-input"
                placeholder="ابحث باسم الطالب أو البريد..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: '400px', width: '100%' }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <div className="spinner"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                لا يوجد طلاب مطابقون للبحث.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filtered.map(student => (
                  <div key={student.id} className="glass-card" style={{ padding: 'clamp(14px,2.5vw,22px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: student.courses.length > 0 ? '14px' : 0 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                            🎓
                          </div>
                          <div>
                            <h3 style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: 'clamp(0.95rem,2.5vw,1.1rem)' }}>{student.name}</h3>
                            <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.82rem' }}>{student.email}</p>
                          </div>
                          {!student.is_verified && (
                            <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700 }}>
                              غير مفعّل
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openNotifModal(student)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.82rem', padding: '8px 14px', flexShrink: 0 }}
                      >
                        🔔 إرسال تنبيه
                      </button>
                    </div>

                    {/* Courses */}
                    {student.courses.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {student.courses.map(c => (
                          <div key={c.course_id} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem'
                          }}>
                            <span style={{ color: '#06b6d4', fontWeight: 700 }}>{c.course_code}</span>
                            <span style={{ color: '#d1d5db', marginRight: '6px' }}>{c.course_title}</span>
                            <span style={{ color: '#6b7280', marginRight: '6px' }}>• منذ {formatDate(c.registered_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {student.courses.length === 0 && (
                      <p style={{ color: '#6b7280', fontSize: '0.82rem', margin: 0, marginTop: '4px' }}>لم يسجل في أي كورس بعد</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Sent Notifications Tab ── */}
        {activeTab === 'sent' && (
          <>
            {loadingSent ? (
              <div style={{ textAlign: 'center', paddingTop: '40px' }}><div className="spinner"></div></div>
            ) : sentNotifs.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                لم يتم إرسال أي تنبيهات بعد.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sentNotifs.map(n => (
                  <div key={n.id} className="glass-card" style={{ padding: 'clamp(12px,2vw,18px)', display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ color: 'white', margin: '0 0 6px', fontWeight: 600, fontSize: 'clamp(0.85rem,2vw,0.95rem)' }}>{n.message}</p>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#9ca3af' }}>
                        <span>👤 {n.student_name} ({n.student_email})</span>
                        <span>📚 {n.course_title}</span>
                        <span>🕐 {new Date(n.created_at).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      background: n.is_read ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: n.is_read ? '#10b981' : '#f59e0b'
                    }}>
                      {n.is_read ? '✓ مقروء' : '⏳ غير مقروء'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Notification Modal ── */}
      {showNotifModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={e => e.target === e.currentTarget && setShowNotifModal(false)}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '520px', padding: 'clamp(20px,4vw,32px)',
            borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)'
          }}>
            <h2 style={{ color: 'white', fontWeight: 800, marginBottom: '20px', fontSize: 'clamp(1rem,3vw,1.3rem)' }}>
              🔔 {broadcast ? 'إرسال تنبيه للجميع' : `إرسال تنبيه لـ ${notifTarget?.name}`}
            </h2>

            <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Broadcast toggle (only when opened for specific student) */}
              {notifTarget && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#d1d5db', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={broadcast}
                    onChange={e => setBroadcast(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  إرسال لكل طلاب الكورس بدلاً من طالب واحد
                </label>
              )}

              {/* Course selector */}
              <div className="form-group">
                <label className="form-label">الكورس (اختياري — اتركه فارغاً للإرسال كتنبيه عام)</label>
                <select
                  className="form-input"
                  value={notifCourseId}
                  onChange={e => setNotifCourseId(e.target.value)}
                >
                  <option value="">عام (بدون كورس محدد)</option>
                  {allCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.course_code})</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="form-group">
                <label className="form-label">نص التنبيه *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  placeholder="اكتب نص التنبيه هنا..."
                  required
                  style={{ resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary" disabled={sending || !notifMessage.trim()} style={{ flex: 1 }}>
                  {sending ? 'جاري الإرسال...' : '📨 إرسال التنبيه'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNotifModal(false)} style={{ flex: 1 }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
