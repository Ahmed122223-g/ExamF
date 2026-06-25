import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaFileSignature, FaShieldAlt, FaClock, FaUserShield } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Landing = () => {
  const [examCode, setExamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!examCode.trim()) return;

    setLoading(true);
    try {
      const data = await apiService.verifyExam(examCode.trim());
      
      // If verification succeeds, navigate to student registration
      navigate(`/register-student/${data.id}`, { state: { exam: data } });
    } catch (err) {
      Swal.fire({
        title: 'خطأ!',
        text: err.response?.data?.detail || 'فشل في العثور على هذا الاختبار. يرجى التحقق من الكود.',
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
      
      {/* Admin Quick Entry Button */}
      <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
        <Link to="/admin/login" className="btn btn-secondary" style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', padding: '8px 16px' }}>
          <FaUserShield />
          لوحة تحكم المسؤول
        </Link>
      </div>

      <div className="glass-card" style={{ maxWidth: '550px', width: '100%', textAlign: 'center', position: 'relative' }}>
        
        {/* Decorative elements */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 24px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          📝
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-dark)', marginBottom: '10px' }}>
          منصة الاختبارات <span>الآمنة</span>
        </h1>
        <p style={{ color: 'var(--text-muted-dark)', marginBottom: '35px', fontSize: '1rem', lineHeight: '1.7' }}>
          يرجى إدخال كود أو معرّف الاختبار الموفر لك من قبل المسؤول لبدء الجلسة الامتحانية مباشرة دون تسجيل دخول.
        </p>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ textAlign: 'right' }}>
            <label className="form-label" style={{ fontSize: '1rem', fontWeight: 'bold' }}>كود / معرّف الاختبار</label>
            <input
              type="text"
              className="form-input"
              value={examCode}
              onChange={(e) => setExamCode(e.target.value)}
              placeholder="مثال: MATH101 أو 1"
              required
              disabled={loading}
              style={{ padding: '15px 20px', fontSize: '1.1rem', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={loading || !examCode.trim()}
            style={{ padding: '15px', fontSize: '1.1rem', marginTop: '10px' }}
          >
            {loading ? 'جاري التحقق...' : 'التحقق والذهاب للاختبار'}
          </button>
        </form>

        <div style={{ 
          marginTop: '40px', 
          paddingTop: '25px', 
          borderTop: '1px solid var(--border-dark)', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '15px' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <FaShieldAlt style={{ color: '#10b981', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)' }}>بيئة محمية وآمنة</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <FaClock style={{ color: '#f59e0b', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)' }}>مؤقت زمني دقيق</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <FaFileSignature style={{ color: '#3b82f6', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)' }}>تصحيح فوري للنتيجة</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
