import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaLock, FaUser, FaShieldAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const data = await apiService.adminLogin(username.trim(), password.trim());
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('admin_username', data.username);
      
      Swal.fire({
        title: 'مرحباً بك!',
        text: 'تم تسجيل الدخول بنجاح إلى لوحة التحكم.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        navigate('/admin/dashboard');
      });
    } catch (err) {
      Swal.fire({
        title: 'فشل الدخول!',
        text: err.response?.data?.detail || 'اسم المستخدم أو كلمة المرور غير صحيحة.',
        icon: 'error',
        confirmButtonText: 'حسناً'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)'
    }}>
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 15px',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <FaShieldAlt />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white' }}>لوحة تحكم المسؤول</h2>
          <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', marginTop: '5px' }}>
            سجل دخولك لإدارة الاختبارات واستخراج النتائج
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaUser style={{ color: '#3b82f6', fontSize: '0.85rem' }} />
              اسم المستخدم
            </label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: admin"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaLock style={{ color: '#f59e0b', fontSize: '0.85rem' }} />
              كلمة المرور
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={loading}
            style={{ padding: '12px', fontSize: '1.05rem', marginTop: '15px', fontWeight: 'bold' }}
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← العودة لبوابة الطلاب
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
