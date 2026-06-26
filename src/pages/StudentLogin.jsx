import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
      });
      return;
    }

    setLoading(true);
    try {
      const data = await apiService.studentLogin(email, password);
      localStorage.setItem('student_token', data.access_token);
      localStorage.setItem('student_name', data.student_name);
      
      Swal.fire({
        icon: 'success',
        title: 'تم تسجيل الدخول',
        text: `مرحباً بك، ${data.student_name}`,
        timer: 1500,
        showConfirmButton: false
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'خطأ في الدخول',
        text: err.response?.data?.detail || 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '15px', direction: 'rtl' }}>
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%', padding: '35px', textAlign: 'right' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '25px', textAlign: 'center', fontWeight: 'bold' }}>
          🔑 تسجيل دخول <span style={{ color: 'var(--accent-color)' }}>الطالب</span>
        </h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                disabled={loading}
                style={{ paddingRight: '40px', width: '100%' }}
              />
              <FaEnvelope style={{ position: 'absolute', top: '16px', right: '15px', color: 'var(--text-muted-dark)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                required
                disabled={loading}
                style={{ paddingRight: '40px', paddingLeft: '40px', width: '100%' }}
              />
              <FaLock style={{ position: 'absolute', top: '16px', right: '15px', color: 'var(--text-muted-dark)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted-dark)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: 0
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'left', marginTop: '-10px' }}>
            <Link to="/forgot-password" style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', textDecoration: 'none' }}>
              نسيت كلمة المرور؟
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={loading}
            style={{ padding: '12px', fontSize: '1.1rem', marginTop: '5px' }}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted-dark)' }}>
          <span>ليس لديك حساب؟ </span>
          <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>
            سجل حساباً جديداً الآن
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
