import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaUser, FaDownload, FaSyncAlt, FaArrowRight, FaCog, FaCheckCircle, FaGithub, FaAndroid } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Settings = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingName, setSavingName] = useState(false);

  // App Update State
  const [githubRepo, setGithubRepo] = useState('Ahmed122223-g/ExamF');
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [releaseInfo, setReleaseInfo] = useState(null);
  const currentVersion = '1.1.1';

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('student_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const data = await apiService.studentGetDashboard(token);
        setName(data.student_name || localStorage.getItem('student_name') || '');
        setEmail(data.student_email || '');
      } catch (err) {
        console.error(err);
        setName(localStorage.getItem('student_name') || '');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'الاسم لا يمكن أن يكون فارغاً'
      });
      return;
    }

    setSavingName(true);
    const token = localStorage.getItem('student_token');

    try {
      await apiService.updateStudentProfile(trimmedName, token);
      localStorage.setItem('student_name', trimmedName);
      Swal.fire({
        icon: 'success',
        title: 'تم الحفظ',
        text: 'تم تحديث اسمك بنجاح! 🎉',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.response?.data?.detail || 'فشل تحديث الاسم، يرجى المحاولة لاحقاً.'
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleCheckUpdates = async () => {
    const repo = githubRepo.trim();
    if (!repo) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إدخال اسم مستودع GitHub'
      });
      return;
    }

    setCheckingUpdates(true);
    setReleaseInfo(null);

    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
      if (!res.ok) {
        throw new Error('لم يتم العثور على إصدارات منشورة في هذا المستودع.');
      }
      const data = await res.json();
      const latestTag = data.tag_name || '';
      const htmlUrl = data.html_url || '';
      
      // Find apk asset if exists
      const apkAsset = data.assets?.find(a => a.name.endsWith('.apk'));
      const downloadUrl = apkAsset ? apkAsset.browser_download_url : htmlUrl;

      // Version compare
      const latestClean = latestTag.replace(/[^0-9.]/g, '');
      const currentClean = currentVersion.replace(/[^0-9.]/g, '');

      let hasUpdate = false;
      const latestParts = latestClean.split('.').map(e => parseInt(e, 10) || 0);
      const currentParts = currentClean.split('.').map(e => parseInt(e, 10) || 0);

      for (let i = 0; i < latestParts.length; i++) {
        const lVal = latestParts[i];
        const cVal = i < currentParts.length ? currentParts[i] : 0;
        if (lVal > cVal) {
          hasUpdate = true;
          break;
        } else if (lVal < cVal) {
          break;
        }
      }

      setReleaseInfo({
        tag: latestTag,
        name: data.name || latestTag,
        url: htmlUrl,
        downloadUrl,
        hasApk: !!apkAsset,
        apkName: apkAsset?.name,
        hasUpdate,
        publishedAt: data.published_at ? new Date(data.published_at).toLocaleDateString('ar-EG') : '',
        body: data.body || ''
      });

      if (hasUpdate) {
        Swal.fire({
          icon: 'info',
          title: 'تحديث جديد متوفر! 🚀',
          text: `يتوفر الإصدار الجديد (${latestTag}) لتطبيق المنصة.`,
          showCancelButton: true,
          confirmButtonText: 'تحميل التحديث الآن',
          cancelButtonText: 'إغلاق',
          confirmButtonColor: '#06b6d4'
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(downloadUrl, '_blank');
          }
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'الإصدار محدث ✅',
          text: `أنت على أحدث إصدار متاح حالياً (${currentVersion}).`,
          timer: 2500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'فشل التحقق',
        text: err.message || 'تعذر الاتصال بـ GitHub للتحقق من التحديثات.'
      });
    } finally {
      setCheckingUpdates(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(15px, 4vw, 35px) clamp(12px, 3vw, 20px)', direction: 'rtl', color: 'white' }}>
      
      {/* Header Bar */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', padding: '10px', borderRadius: '12px', display: 'flex' }}>
            <FaCog style={{ fontSize: '1.4rem' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 'bold' }}>إعدادات الحساب والتطبيق</h1>
            <p style={{ margin: '3px 0 0 0', color: '#9ca3af', fontSize: '0.85rem' }}>تخصيص البيانات الشخصية وتحميل آخر تحديثات التطبيق</p>
          </div>
        </div>
        
        <Link
          to="/dashboard"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '0.9rem', textDecoration: 'none' }}
        >
          <FaArrowRight /> العودة للرئيسية
        </Link>
      </div>

      {loadingProfile ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#9ca3af' }}>
          <div className="spinner" style={{ margin: '0 auto 15px' }}></div>
          جاري تحميل الإعدادات...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Profile Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaUser style={{ color: '#8b5cf6' }} /> البيانات الشخصية
            </h2>

            <form onSubmit={handleUpdateName}>
              {email && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>البريد الإلكتروني (غير قابل للتعديل):</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#9ca3af',
                      fontSize: '0.95rem',
                      direction: 'ltr',
                      textAlign: 'right'
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#e5e7eb', marginBottom: '6px', fontWeight: 'bold' }}>اسم الطالب / المستخدم:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الجديد..."
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={savingName}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  padding: '11px 24px',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {savingName ? 'جاري الحفظ...' : '💾 حفظ الاسم الجديد'}
              </button>
            </form>
          </div>

          {/* App Version & Updates Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaAndroid style={{ color: '#10b981' }} /> تحميل وتحديث تطبيق المنصة
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '20px' }}>
              يمكنك التحقق من توفر إصدارات جديدة من تطبيق الهاتف وتحميل ملف الـ APK المباشر من GitHub بكل سهولة.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '18px' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>إصدار المنصة الحالي:</span>
              <span style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', direction: 'ltr' }}>
                v{currentVersion}
              </span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' }}>مستودع التحديثات (GitHub Repository):</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="owner/repo"
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    direction: 'ltr'
                  }}
                />
                <button
                  type="button"
                  onClick={handleCheckUpdates}
                  disabled={checkingUpdates}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                    padding: '11px 20px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <FaSyncAlt className={checkingUpdates ? 'fa-spin' : ''} />
                  {checkingUpdates ? 'جاري الفحص...' : 'فحص التحديثات'}
                </button>
              </div>
            </div>

            {releaseInfo && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '18px', border: `1px solid ${releaseInfo.hasUpdate ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {releaseInfo.hasUpdate ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        <FaCheckCircle /> إصدار جديد متوفر ({releaseInfo.tag})
                      </span>
                    ) : (
                      <span style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        <FaCheckCircle /> الإصدار الحالي محدث ({releaseInfo.tag})
                      </span>
                    )}
                  </div>
                  {releaseInfo.publishedAt && (
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>تاريخ النشر: {releaseInfo.publishedAt}</span>
                  )}
                </div>

                {releaseInfo.body && (
                  <p style={{ color: '#d1d5db', fontSize: '0.85rem', margin: '8px 0 14px 0', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                    {releaseInfo.body}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <a
                    href={releaseInfo.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      background: '#10b981',
                      borderColor: '#10b981',
                      padding: '8px 18px',
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none'
                    }}
                  >
                    <FaDownload /> {releaseInfo.hasApk ? 'تحميل ملف APK المباشر' : 'فتح صفحة التحميل على GitHub'}
                  </a>

                  <a
                    href={releaseInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.88rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    <FaGithub /> عرض في GitHub
                  </a>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default Settings;
