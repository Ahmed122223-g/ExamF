import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import Swal from 'sweetalert2';
import { generateStudentPDF } from '../utils/generateStudentPDF';

export default function AdminStudents() {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const [selectedReportStudent, setSelectedReportStudent] = useState(null);

  const [selectedPermissionsStudent, setSelectedPermissionsStudent] = useState(null);
  const [selectedPermissionCourseId, setSelectedPermissionCourseId] = useState('');
  const [permissionCards, setPermissionCards] = useState([]);
  const [permissionExceptions, setPermissionExceptions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTarget, setNotifTarget] = useState(null); // null = broadcast
  const [notifCourseId, setNotifCourseId] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [broadcast, setBroadcast] = useState(false);
  const [sending, setSending] = useState(false);

  const [allCourses, setAllCourses] = useState([]);

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

  const openPermissionsModal = (student) => {
    setSelectedPermissionsStudent(student);
    setPermissionCards([]);
    setPermissionExceptions([]);
    if (student.courses && student.courses.length > 0) {
      const initialCourseId = student.courses[0].course_id;
      setSelectedPermissionCourseId(initialCourseId);
      fetchPermissionsData(student.id, initialCourseId);
    } else {
      setSelectedPermissionCourseId('');
    }
  };

  const fetchPermissionsData = async (studentId, courseId) => {
    setLoadingPermissions(true);
    try {
      const [cards, exceptions] = await Promise.all([
        apiService.getCourseCardsAdmin(courseId, token),
        apiService.getStudentCardExceptions(studentId, token)
      ]);
      setPermissionCards(cards);
      setPermissionExceptions(exceptions);
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', 'فشل في تحميل صلاحيات الطالب لهذا الكورس', 'error');
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleGrantException = async (cardDbId, cardTitle) => {
    try {
      const studentId = selectedPermissionsStudent.id;
      const res = await apiService.grantStudentCardException(studentId, cardDbId, token);
      Swal.fire({
        icon: 'success',
        title: 'تم فتح الكارت',
        text: res.message || `تم منح صلاحية تخطي تاريخ الإغلاق لـ ${cardTitle}`,
        timer: 2000,
        showConfirmButton: false
      });
      fetchPermissionsData(studentId, selectedPermissionCourseId);
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في فتح الكارت للطالب', 'error');
    }
  };

  const handleRevokeException = async (cardDbId, cardTitle) => {
    try {
      const studentId = selectedPermissionsStudent.id;
      const res = await apiService.revokeStudentCardException(studentId, cardDbId, token);
      Swal.fire({
        icon: 'success',
        title: 'تم إلغاء الصلاحية',
        text: res.message || `تم سحب صلاحية تخطي تاريخ الإغلاق لـ ${cardTitle}`,
        timer: 2000,
        showConfirmButton: false
      });
      fetchPermissionsData(studentId, selectedPermissionCourseId);
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في إلغاء صلاحية الطالب', 'error');
    }
  };

  const handleToggleSuper = async (studentId, courseId) => {
    try {
      const res = await apiService.toggleStudentSuper(studentId, courseId, token);
      Swal.fire({
        icon: 'success',
        title: res.is_super ? 'تم تفعيل وضع السوبر ⭐' : 'تم إلغاء وضع السوبر',
        text: res.message,
        timer: 2000,
        showConfirmButton: false
      });
      await fetchStudents();
      setSelectedPermissionsStudent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: (prev.courses || []).map(c => c.course_id === courseId ? { ...c, is_super: res.is_super } : c)
        };
      });
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في تعديل حالة الطالب السوبر', 'error');
    }
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

  const handleDeleteStudent = async (student) => {
    const result = await Swal.fire({
      title: `حذف الطالب؟`,
      html: `<div style="direction:rtl;text-align:right">
        <p>هل أنت متأكد من حذف <strong>${student.name}</strong>؟</p>
        <p style="color:#f87171;font-size:0.85rem;margin-top:8px">⚠️ سيتم حذف جميع بياناته بشكل دائم: الكويزات، الإجابات، المشاريع، والكورسات المسجلة.</p>
      </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
    });
    if (!result.isConfirmed) return;

    try {
      const res = await apiService.deleteStudent(student.id, token);
      setStudents(prev => prev.filter(s => s.id !== student.id));
      Swal.fire({ icon: 'success', title: 'تم الحذف', text: res.message, timer: 2500, showConfirmButton: false });
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في حذف الطالب', 'error');
    }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-EG') : '—';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', direction: 'rtl' }}>
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

                {activeTab === 'students' && (
          <>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
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
                          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
                            التقييم: {student.evaluation || '—'}
                          </span>
                          <span style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', padding: '2px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
                            متوسط الامتحانات: {student.avg_exam_pct}%
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedReportStudent(student)}
                          className="btn"
                          style={{
                            fontSize: '0.82rem', padding: '8px 14px',
                            background: 'rgba(6,182,212,0.15)',
                            border: '1px solid rgba(6,182,212,0.4)',
                            color: '#06b6d4',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          📄 التقرير التفصيلي
                        </button>
                        <button
                          onClick={() => openPermissionsModal(student)}
                          className="btn"
                          style={{
                            fontSize: '0.82rem', padding: '8px 14px',
                            background: 'rgba(168,85,247,0.15)',
                            border: '1px solid rgba(168,85,247,0.4)',
                            color: '#c084fc',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          🔓 صلاحيات الكروت
                        </button>
                        <button
                          onClick={() => openNotifModal(student)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
                        >
                          🔔 تنبيه
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="btn"
                          style={{
                            fontSize: '0.82rem', padding: '8px 14px',
                            background: 'rgba(239,68,68,0.15)',
                            border: '1px solid rgba(239,68,68,0.4)',
                            color: '#f87171',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>

                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.82rem' }}>
                      <span style={{ color: '#d1d5db' }}>⏱️ النشاط اليومي: <strong style={{ color: '#a855f7' }}>{student.daily_active_str || '0ث'}</strong></span>
                      <span style={{ color: '#6b7280' }}>•</span>
                      <span style={{ color: '#d1d5db' }}>🕒 آخر نشاط: <strong style={{ color: '#fff' }}>{student.last_active ? new Date(student.last_active).toLocaleString('ar-EG') : 'غير نشط مؤخراً'}</strong></span>
                      <span style={{ color: '#6b7280' }}>•</span>
                      <span style={{ color: '#d1d5db' }}>📝 الامتحانات المنجزة: <strong style={{ color: '#f59e0b' }}>{student.exam_attempts?.length || 0}</strong></span>
                    </div>

                                        {student.courses.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {student.courses.map(c => (
                          <div key={c.course_id} style={{
                            background: c.is_super ? 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(168,85,247,0.1))' : 'rgba(255,255,255,0.04)',
                            border: c.is_super ? '1px solid rgba(234,179,8,0.35)' : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
                          }}>
                            <span style={{ color: '#06b6d4', fontWeight: 700 }}>{c.course_code}</span>
                            <span style={{ color: '#d1d5db' }}>{c.course_title}</span>
                            {c.is_super && (
                              <span style={{
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: '#1e1b4b',
                                fontWeight: 900,
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 0 10px rgba(245,158,11,0.3)'
                              }}>
                                ⭐ سوبر (مفتوح بالكامل)
                              </span>
                            )}
                            <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              ✅ أنجز {c.cards_completed} من {c.total_cards} كارت
                            </span>
                            <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              ❓ حل {c.answered_questions} / {c.total_questions} سؤال
                            </span>
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

                {activeTab === 'sent' && (
          <>
            {loadingSent ? (
              <div style={{ textHeading: 'center', paddingTop: '40px' }}><div className="spinner"></div></div>
            ) : sentNotifs.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                لم يتم إرسال أي تنبيهات بعد.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sentNotifs.map(n => (
                  <div key={n.id} className="glass-card" style={{ padding: 'clamp(12px,2vw,18px)', display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ color: 'white', margin: '0 0 6px', fontWeight: 600, fontSize: 'clamp(0.85rem,2vw,0.95rem)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{n.message}</p>
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

            {selectedReportStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={e => e.target === e.currentTarget && setSelectedReportStudent(null)}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
            padding: 'clamp(20px,4vw,32px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', direction: 'rtl', textAlign: 'right'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: 800, margin: 0 }}>📄 تقرير الأداء الشامل</h2>
                <p style={{ color: '#06b6d4', margin: '4px 0 0', fontWeight: 600 }}>الطالب: {selectedReportStudent.name} ({selectedReportStudent.email})</p>
              </div>
              <button
                onClick={() => setSelectedReportStudent(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white',
                  width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                  fontSize: '1.2rem', fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '14px', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>⭐ التقييم العام</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: 'white', marginTop: '6px' }}>{selectedReportStudent.evaluation}</strong>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>معدل تقدم عام: {selectedReportStudent.overall_score}%</span>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', padding: '14px', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#3b82f6', fontWeight: 'bold' }}>📈 متوسط الامتحانات</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: 'white', marginTop: '6px' }}>{selectedReportStudent.avg_exam_pct}%</strong>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>إجمالي الاختبارات: {selectedReportStudent.exam_attempts?.length || 0}</span>
              </div>
              <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', padding: '14px', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#a855f7', fontWeight: 'bold' }}>⏱️ نشاط اليوم اليومي</span>
                <strong style={{ display: 'block', fontSize: '1.5rem', color: 'white', marginTop: '6px' }}>{selectedReportStudent.daily_active_str || '0ث'}</strong>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>تاريخ النشاط: {new Date().toLocaleDateString('ar-EG')}</span>
              </div>
              <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', padding: '14px', borderRadius: '12px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#06b6d4', fontWeight: 'bold' }}>🕒 آخر ظهور ونشاط</span>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'white', marginTop: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedReportStudent.last_active ? new Date(selectedReportStudent.last_active).toLocaleString('ar-EG') : 'غير نشط مؤخراً'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>حالة الحساب: {selectedReportStudent.is_verified ? 'مفعّل ✓' : 'غير مفعّل ⏳'}</span>
              </div>
            </div>

                        <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '12px', borderRight: '3px solid #06b6d4', paddingRight: '8px' }}>📂 تقدم الكورسات والدروس</h3>
            {selectedReportStudent.courses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {selectedReportStudent.courses.map(c => {
                  const cardPercent = c.total_cards > 0 ? Math.round((c.cards_completed / c.total_cards) * 100) : 0;
                  const qsPercent = c.total_questions > 0 ? Math.round((c.answered_questions / c.total_questions) * 100) : 0;
                  return (
                    <div key={c.course_id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{c.course_title} ({c.course_code})</span>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>تاريخ التسجيل: {formatDate(c.registered_at)}</span>
                      </div>
                      
                                            <div style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', color: '#d1d5db' }}>
                          <span>✅ نسبة إنجاز الدروس والبطاقات</span>
                          <span>{c.cards_completed} / {c.total_cards} كارت ({cardPercent}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${cardPercent}%`, height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                                            <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', color: '#d1d5db' }}>
                          <span>❓ إجابات أسئلة الكروت المكتوبة</span>
                          <span>{c.answered_questions} / {c.total_questions} سؤال ({qsPercent}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${qsPercent}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }}></div>
                        </div>
                      </div>

                                            {c.completed_cards_details?.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 'bold', marginBottom: '6px' }}>
                            ✅ الكروت المكتملة ({c.completed_cards_details.length}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {c.completed_cards_details.map((card, idx) => (
                              <span key={card.card_id} style={{
                                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                                color: '#6ee7b7', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600'
                              }}>
                                {idx + 1}. {card.card_title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                                            {c.answered_questions_details?.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 'bold', marginBottom: '6px' }}>
                            ❓ الأسئلة المحلولة ({c.answered_questions_details.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {c.answered_questions_details.map(q => (
                              <div key={q.question_id} style={{
                                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                                borderRadius: '8px', padding: '5px 10px', fontSize: '0.75rem',
                                display: 'flex', alignItems: 'flex-start', gap: '8px'
                              }}>
                                <span style={{ color: '#fbbf24', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                  [{q.card_title} — سؤال {q.question_number}]
                                </span>
                                <span style={{ color: '#d1d5db' }}>{q.question_preview}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontStyle: 'italic', marginBottom: '24px' }}>لم يسجل في أي كورس بعد.</p>
            )}

                        <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '12px', borderRight: '3px solid #f59e0b', paddingRight: '8px' }}>📝 تفاصيل محاولات ونتائج الاختبارات</h3>
            {selectedReportStudent.exam_attempts?.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#d1d5db', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'white' }}>اسم الامتحان</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>الدرجة</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>النسبة</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>الوقت المستغرق</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>التاريخ</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>المخالفات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReportStudent.exam_attempts.map((attempt, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{attempt.exam_title} ({attempt.exam_code})</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>{attempt.score}</span> / {attempt.total_marks}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: attempt.percentage >= 50 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          {attempt.percentage}%
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#06b6d4', fontWeight: 'bold' }}>{attempt.duration_str}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>
                          {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString('ar-EG') : 'غير مسلّم'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {attempt.is_cheated ? (
                            <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                              ⚠️ تم رصد مخالفة (غش)
                            </span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>سليمة ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>لم يقم بأداء أي اختبارات بعد.</p>
            )}

            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={async () => {
                  setPdfLoading(true);
                  try {
                    await generateStudentPDF(selectedReportStudent);
                  } catch (e) {
                    console.error('PDF error:', e);
                  } finally {
                    setPdfLoading(false);
                  }
                }}
                disabled={pdfLoading}
                className="btn btn-primary"
                style={{ padding: '10px 24px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', fontWeight: 'bold', opacity: pdfLoading ? 0.7 : 1, cursor: pdfLoading ? 'wait' : 'pointer' }}
              >
                {pdfLoading ? '⏳ جاري التحميل...' : '⬇️ تحميل تقرير PDF'}
              </button>
              <button
                onClick={() => setSelectedReportStudent(null)}
                className="btn btn-secondary"
                style={{ padding: '10px 24px', borderRadius: '8px' }}
              >
                إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}

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

            {selectedPermissionsStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={e => e.target === e.currentTarget && setSelectedPermissionsStudent(null)}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '720px', maxHeight: '88vh', overflowY: 'auto',
            padding: 'clamp(20px,4vw,30px)', borderRadius: '20px',
            border: '1px solid rgba(168,85,247,0.3)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.6)', direction: 'rtl', textAlign: 'right'
          }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: 800, margin: 0, fontSize: '1.15rem' }}>🔓 إدارة صلاحيات الكروت</h2>
                <p style={{ color: '#c084fc', margin: '4px 0 0', fontWeight: 600, fontSize: '0.9rem' }}>
                  الطالب: {selectedPermissionsStudent.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedPermissionsStudent(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white',
                  width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                  fontSize: '1.1rem', fontWeight: 'bold', flexShrink: 0
                }}
              >✕</button>
            </div>

                        <div style={{
              background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.83rem', color: '#d1d5db', lineHeight: 1.7
            }}>
              💡 الكروت التي تمنحها صلاحية <strong style={{ color: '#c084fc' }}>تخطي تاريخ الإغلاق</strong> ستُفتح للطالب بشكل دائم حتى يقوم الأدمن بإلغاء الصلاحية يدوياً.
            </div>

                        {selectedPermissionsStudent.courses?.length > 0 ? (
              <>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">اختر الكورس</label>
                  <select
                    className="form-input"
                    value={selectedPermissionCourseId}
                    onChange={e => {
                      const cid = parseInt(e.target.value);
                      setSelectedPermissionCourseId(cid);
                      fetchPermissionsData(selectedPermissionsStudent.id, cid);
                    }}
                  >
                    {selectedPermissionsStudent.courses.map(c => (
                      <option key={c.course_id} value={c.course_id}>{c.course_title} ({c.course_code}) {c.is_super ? '⭐ (سوبر)' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Super Student Control Panel */}
                {(() => {
                  const currentCourse = (selectedPermissionsStudent.courses || []).find(c => c.course_id === selectedPermissionCourseId);
                  const isSuper = Boolean(currentCourse?.is_super);
                  return (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      background: isSuper
                        ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(168, 85, 247, 0.15))'
                        : 'rgba(255,255,255,0.03)',
                      border: isSuper ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: isSuper ? '#fbbf24' : 'white' }}>
                            ⭐ وضع الطالب السوبر (Super Student)
                          </span>
                          {isSuper ? (
                            <span style={{ background: '#fbbf24', color: '#0f172a', fontSize: '0.75rem', fontWeight: 900, padding: '2px 10px', borderRadius: '20px' }}>
                              مفعل لهذا الكورس ✓
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>
                              غير مفعل
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: isSuper ? '#fde68a' : '#9ca3af', lineHeight: 1.6 }}>
                          {isSuper
                            ? 'جميع كروت هذا الكورس مفتوحة للطالب مباشرة دون التقيد بمواعيد الفتح/الإغلاق أو حل الأسئلة السابقة.'
                            : 'تفعيل هذا الزر يفتح جميع كروت ودروس الكورس للطالب فوراً ويتجاوز أي قيود مواعيد أو متطلبات مسبقة.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleSuper(selectedPermissionsStudent.id, selectedPermissionCourseId)}
                        className="btn"
                        style={{
                          padding: '9px 18px',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          background: isSuper ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #f59e0b, #a855f7)',
                          border: isSuper ? '1px solid #ef4444' : 'none',
                          color: isSuper ? '#f87171' : 'white',
                          boxShadow: isSuper ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.35)',
                          flexShrink: 0
                        }}
                      >
                        {isSuper ? '🚫 إلغاء وضع السوبر' : '⭐ تفعيل كطالب سوبر'}
                      </button>
                    </div>
                  );
                })()}

                                {permissionExceptions.length > 0 && (
                  <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px' }}>
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.82rem', marginBottom: '8px' }}>
                      ✅ الصلاحيات الممنوحة حالياً ({permissionExceptions.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {permissionExceptions.map(exc => (
                        <span key={exc.course_card_id} style={{
                          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                          color: '#6ee7b7', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600
                        }}>
                          🔓 {exc.card_title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                                {loadingPermissions ? (
                  <div style={{ textAlign: 'center', padding: '30px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ color: '#9ca3af', marginTop: '12px' }}>جاري التحميل...</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {permissionCards.map(card => {
                      const isExcepted = permissionExceptions.some(e => e.course_card_id === card.id);
                      const isLocked = card.lock_date && new Date().toISOString().split('T')[0] >= card.lock_date;
                      return (
                        <div key={card.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', borderRadius: '10px', gap: '10px', flexWrap: 'wrap',
                          background: isExcepted
                            ? 'rgba(16,185,129,0.08)'
                            : isLocked ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
                          border: isExcepted
                            ? '1px solid rgba(16,185,129,0.25)'
                            : isLocked ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>{card.title}</span>
                              {isExcepted && (
                                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '1px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  🔓 مفتوح
                                </span>
                              )}
                              {isLocked && !isExcepted && (
                                <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '1px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>
                                  🔒 مغلق حتى {card.lock_date}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {isExcepted ? (
                              <button
                                onClick={() => handleRevokeException(card.id, card.title)}
                                style={{
                                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                                  color: '#f87171', padding: '5px 12px', borderRadius: '8px',
                                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                                }}
                              >
                                🚫 إلغاء الصلاحية
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGrantException(card.id, card.title)}
                                style={{
                                  background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
                                  color: '#c084fc', padding: '5px 12px', borderRadius: '8px',
                                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
                                }}
                              >
                                🔓 منح صلاحية
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                هذا الطالب غير مسجل في أي كورس بعد.
              </div>
            )}

                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', textAlign: 'left' }}>
              <button
                onClick={() => setSelectedPermissionsStudent(null)}
                className="btn btn-secondary"
                style={{ padding: '9px 24px' }}
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
