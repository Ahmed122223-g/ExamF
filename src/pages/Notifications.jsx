import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import Swal from 'sweetalert2';

export default function Notifications() {
  const navigate = useNavigate();
  const token = localStorage.getItem('student_token');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await apiService.getMyNotifications(token);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchNotifications();
  }, [token]);

  const markRead = async (id) => {
    try {
      await apiService.markNotificationRead(id, token);
      setData(prev => ({
        ...prev,
        unread_count: Math.max(0, prev.unread_count - 1),
        groups: prev.groups.map(g => ({
          ...g,
          notifications: g.notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
        }))
      }));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiService.markAllNotificationsRead(token);
      setData(prev => ({
        ...prev,
        unread_count: 0,
        groups: prev.groups.map(g => ({
          ...g,
          notifications: g.notifications.map(n => ({ ...n, is_read: true }))
        }))
      }));
    } catch (err) { console.error(err); }
    finally { setMarkingAll(false); }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('ar-EG', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

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
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 'clamp(0.9rem,2.5vw,1.1rem)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← العودة للوحة التحكم
        </Link>
        <span style={{ fontWeight: 800, fontSize: 'clamp(1rem,3vw,1.3rem)', color: 'white' }}>
          🔔 التنبيهات
          {data?.unread_count > 0 && (
            <span style={{ background: '#ef4444', color: 'white', borderRadius: '50px', fontSize: '0.75rem', padding: '2px 8px', marginRight: '8px', fontWeight: 700 }}>
              {data.unread_count}
            </span>
          )}
        </span>
        {data?.unread_count > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '8px 14px' }}
          >
            {markingAll ? '...' : '✓ تعليم الكل كمقروء'}
          </button>
        )}
      </nav>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'clamp(14px,3vw,30px) clamp(12px,3vw,20px)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <div className="spinner"></div>
            <p style={{ color: '#9ca3af', marginTop: '12px' }}>جاري تحميل التنبيهات...</p>
          </div>
        ) : !data || data.groups.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 'clamp(30px,5vw,60px)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔕</div>
            <h2 style={{ color: 'white', marginBottom: '10px' }}>لا توجد تنبيهات</h2>
            <p style={{ color: '#9ca3af' }}>ستظهر هنا أي تنبيهات يرسلها لك الأدمن.</p>
          </div>
        ) : (
          data.groups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: '28px' }}>
              {/* Course header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '12px', paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span style={{ fontSize: '1.1rem' }}>📚</span>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: 'clamp(0.95rem,2.5vw,1.15rem)', margin: 0 }}>
                  {group.course_title}
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginRight: 'auto' }}>
                  {group.notifications.length} تنبيه
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {group.notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    style={{
                      background: n.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.08)',
                      border: `1px solid ${n.is_read ? 'rgba(255,255,255,0.08)' : 'rgba(59,130,246,0.3)'}`,
                      borderRadius: '12px',
                      padding: 'clamp(12px,2.5vw,18px)',
                      cursor: n.is_read ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
                      background: n.is_read ? '#374151' : '#3b82f6',
                      boxShadow: n.is_read ? 'none' : '0 0 8px rgba(59,130,246,0.5)'
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{
                        color: n.is_read ? '#d1d5db' : 'white',
                        fontWeight: n.is_read ? 400 : 600,
                        margin: '0 0 6px',
                        lineHeight: '1.7',
                        fontSize: 'clamp(0.88rem,2vw,0.98rem)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {n.message}
                      </p>
                      <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>
                        🕐 {formatDate(n.created_at)}
                        {!n.is_read && <span style={{ color: '#3b82f6', marginRight: '8px', fontSize: '0.75rem' }}>• انقر للتعليم كمقروء</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
