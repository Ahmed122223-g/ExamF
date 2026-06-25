import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import Swal from 'sweetalert2';

const StudentRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'كلمتا المرور غير متطابقتين!'
      });
      return;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل!'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.studentSignup(name, email, password, confirmPassword);
      Swal.fire({
        icon: 'info',
        title: 'تأكيد الحساب',
        text: res.message || 'تم إرسال رمز التأكيد لبريدك الإلكتروني.'
      });
      setVerifying(true);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'فشل التسجيل',
        text: err.response?.data?.detail || 'حدث خطأ أثناء إنشاء الحساب.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      Swal.fire({
        icon: 'warning',
        title: 'تنبيه',
        text: 'يرجى إدخال رمز التأكيد المكون من 6 أرقام.'
      });
      return;
    }

    setLoading(true);
    try {
      const data = await apiService.studentVerifyEmail(email, verificationCode);
      localStorage.setItem('student_token', data.access_token);
      localStorage.setItem('student_name', data.student_name);

      Swal.fire({
        icon: 'success',
        title: 'تم التفعيل بنجاح!',
        text: data.message,
        timer: 1500,
        showConfirmButton: false
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'رمز غير صحيح',
        text: err.response?.data?.detail || 'فشل التحقق من البريد الإلكتروني.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '15px', direction: 'rtl' }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '35px', textAlign: 'right' }}>
        
        {!verifying ? (
          <>
            <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '25px', textAlign: 'center', fontWeight: 'bold' }}>
              📝 إنشاء حساب <span style={{ color: 'var(--accent-color)' }}>طالب جديد</span>
            </h2>
            
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="form-group">
                <label className="form-label">الاسم ثلاثي</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد محمد علي"
                    required
                    disabled={loading}
                    style={{ paddingRight: '40px', width: '100%' }}
                  />
                  <FaUser style={{ position: 'absolute', top: '16px', right: '15px', color: 'var(--text-muted-dark)' }} />
                </div>
              </div>

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

              <div className="form-group">
                <label className="form-label">تأكيد كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="******"
                    required
                    disabled={loading}
                    style={{ paddingRight: '40px', paddingLeft: '40px', width: '100%' }}
                  />
                  <FaLock style={{ position: 'absolute', top: '16px', right: '15px', color: 'var(--text-muted-dark)' }} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                disabled={loading}
                style={{ padding: '12px', fontSize: '1.1rem', marginTop: '10px' }}
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
              </button>
            </form>

            <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted-dark)' }}>
              <span>لديك حساب بالفعل؟ </span>
              <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>
                سجل دخولك الآن
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '1.8rem', color: 'white', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
              📧 تأكيد الحساب
            </h2>
            <p style={{ color: 'var(--text-muted-dark)', textAlign: 'center', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.6' }}>
              تم إرسال كود تفعيل مكون من 6 أرقام إلى بريدك الإلكتروني <strong>{email}</strong>. يرجى كتابته لتفعيل حسابك.
            </p>
            
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ textAlign: 'center' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '10px' }}>رمز التأكيد (6 أرقام)</label>
                <div style={{ position: 'relative', maxWidth: '280px', margin: '0 auto' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    disabled={loading}
                    style={{ paddingRight: '40px', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '4px' }}
                  />
                  <FaKey style={{ position: 'absolute', top: '18px', right: '15px', color: 'var(--text-muted-dark)', fontSize: '1.1rem' }} />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-accent"
                disabled={loading || verificationCode.length !== 6}
                style={{ padding: '12px', fontSize: '1.1rem', marginTop: '10px' }}
              >
                {loading ? 'جاري التحقق...' : 'تأكيد وتفعيل الحساب'}
              </button>
            </form>

            <div style={{ marginTop: '25px', textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => setVerifying(false)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                تعديل بيانات الحساب
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentRegister;
