import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaKey, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';

const StudentForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      Swal.fire('تنبيه', 'يرجى إدخال البريد الإلكتروني.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await apiService.studentForgotPassword(email.trim().toLowerCase());
      Swal.fire({
        icon: 'success',
        title: 'تم إرسال الكود!',
        text: 'تم إرسال كود التحقق المكون من 6 أرقام إلى بريدك الإلكتروني بنجاح.',
        timer: 3000,
        showConfirmButton: true,
        confirmButtonText: 'حسناً'
      });
      setStep(2);
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في إرسال كود التحقق. تأكد من صحة البريد الإلكتروني.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      Swal.fire('تنبيه', 'يرجى إدخال كود التحقق المكون من 6 أرقام.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await apiService.studentVerifyResetCode(email.trim().toLowerCase(), code.trim());
      Swal.fire({
        icon: 'success',
        title: 'تم التحقق!',
        text: 'الكود صحيح، يرجى كتابة كلمة المرور الجديدة الآن.',
        timer: 2000,
        showConfirmButton: false
      });
      setStep(3);
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', err.response?.data?.detail || 'كود التحقق غير صحيح أو منتهي الصلاحية.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      Swal.fire('تنبيه', 'يجب أن تتكون كلمة المرور من 6 أرقام أو حروف على الأقل.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      Swal.fire('تنبيه', 'كلمتا المرور غير متطابقتين.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await apiService.studentResetPassword(email.trim().toLowerCase(), code.trim(), password, confirmPassword);
      Swal.fire({
        icon: 'success',
        title: 'تمت العملية بنجاح!',
        text: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بحسابك.',
        confirmButtonText: 'تسجيل الدخول الآن'
      }).then(() => {
        navigate('/login');
      });
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في إعادة تعيين كلمة المرور. يرجى المحاولة مجدداً.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '15px', direction: 'rtl' }}>
      <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '35px', textAlign: 'right' }}>
        
        <h2 style={{ fontSize: '1.7rem', color: 'white', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
          🔒 استعادة <span style={{ color: 'var(--accent-color)' }}>كلمة المرور</span>
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', position: 'relative', padding: '0 10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
            <span style={{
              width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
              background: step >= 1 ? 'var(--accent-color)' : '#1f2937', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold'
            }}>1</span>
            <span style={{ fontSize: '0.75rem', color: step >= 1 ? '#fff' : 'var(--text-muted-dark)', marginTop: '5px' }}>البريد الإلكتروني</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
            <span style={{
              width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
              background: step >= 2 ? 'var(--accent-color)' : '#1f2937', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold'
            }}>2</span>
            <span style={{ fontSize: '0.75rem', color: step >= 2 ? '#fff' : 'var(--text-muted-dark)', marginTop: '5px' }}>كود التحقق</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
            <span style={{
              width: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
              background: step >= 3 ? 'var(--accent-color)' : '#1f2937', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold'
            }}>3</span>
            <span style={{ fontSize: '0.75rem', color: step >= 3 ? '#fff' : 'var(--text-muted-dark)', marginTop: '5px' }}>كلمة المرور الجديدة</span>
          </div>
          <div style={{
            position: 'absolute', top: '15px', left: '30px', right: '30px', height: '2px',
            background: `linear-gradient(to left, var(--accent-color) ${step === 1 ? '10%' : step === 2 ? '50%' : '100%'}, #1f2937 0%)`,
            zIndex: 1
          }}></div>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '5px' }}>
              أدخل البريد الإلكتروني المسجل في حسابك، وسنقوم بإرسال رمز تحقق سري مكون من 6 أرقام لتأكيد هويتك.
            </p>
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
            <button type="submit" className="btn btn-accent" disabled={loading} style={{ padding: '12px', fontSize: '1.1rem', marginTop: '10px' }}>
              {loading ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '5px' }}>
              تم إرسال كود تحقق سري إلى البريد <strong>{email}</strong>. الرجاء إدخاله أدناه للمتابعة.
            </p>
            <div className="form-group">
              <label className="form-label">كود التأكيد (6 أرقام)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  maxLength={6}
                  className="form-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  disabled={loading}
                  style={{ paddingRight: '40px', width: '100%', textAlign: 'center', letterSpacing: '8px', fontSize: '1.3rem' }}
                />
                <FaKey style={{ position: 'absolute', top: '16px', right: '15px', color: 'var(--text-muted-dark)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="submit" className="btn btn-accent" disabled={loading} style={{ flex: 1, padding: '12px', fontSize: '1.05rem' }}>
                {loading ? 'جاري التحقق...' : 'تأكيد الكود'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} disabled={loading} style={{ width: '100px' }}>
                رجوع
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '5px' }}>
              اكتب كلمة المرور الجديدة لحسابك وقم بتأكيدها بشكل صحيح.
            </p>
            
            <div className="form-group">
              <label className="form-label">كلمة المرور الجديدة</label>
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
                    position: 'absolute', top: '12px', left: '12px', background: 'none', border: 'none',
                    color: 'var(--text-muted-dark)', cursor: 'pointer', fontSize: '1.2rem', padding: 0
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">تأكيد كلمة المرور الجديدة</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  required
                  disabled={loading}
                  style={{ paddingRight: '40px', paddingLeft: '40px', width: '100%' }}
                />
                <FaLock style={{ position: 'absolute', top: '16px', right: '15px', color: 'var(--text-muted-dark)' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-accent" disabled={loading} style={{ padding: '12px', fontSize: '1.1rem', marginTop: '10px' }}>
              {loading ? 'جاري الحفظ...' : 'تحديث كلمة المرور والدخول'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted-dark)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <FaArrowLeft style={{ fontSize: '0.8rem' }} /> العودة لتسجيل الدخول
          </Link>
        </div>

      </div>
    </div>
  );
};

export default StudentForgotPassword;
