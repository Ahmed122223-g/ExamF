import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaPlus, FaTrash, FaSignOutAlt, FaChevronRight, FaClipboardList, FaClock, FaCheckCircle, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminExams = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Exam Form State
  const [title, setTitle] = useState('');
  const [examCode, setExamCode] = useState('');
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState('');
  const [questions, setQuestions] = useState([
    { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', marks: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchExams = async () => {
      try {
        const data = await apiService.getExams(token);
        setExams(data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
        } else {
          Swal.fire('خطأ!', 'فشل في تحميل الاختبارات.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [token, navigate, action]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin/login');
  };

  // Add a question to builder
  const addQuestionField = () => {
    setQuestions(prev => [
      ...prev,
      { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', marks: 1 }
    ]);
  };

  // Remove a question from builder
  const removeQuestionField = (index) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // Update question builder inputs
  const updateQuestionField = (index, field, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startTime) {
      Swal.fire('تنبيه!', 'يرجى إكمال الحقول الأساسية للاختبار.', 'warning');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        Swal.fire('تنبيه!', `يرجى إكمال السؤال رقم ${i + 1} مع كافة الاختيارات الأربعة.`, 'warning');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        exam_code: examCode.trim(),
        duration_minutes: parseInt(duration),
        start_time: new Date(startTime).toISOString(),
        questions: questions.map(q => ({
          ...q,
          marks: parseInt(q.marks)
        }))
      };

      await apiService.createExam(payload, token);
      
      Swal.fire({
        title: 'تم الإنشاء!',
        text: 'تم إنشاء الاختبار وإضافة الأسئلة بنجاح.',
        icon: 'success'
      }).then(() => {
        navigate('/admin/exams');
      });

    } catch (err) {
      Swal.fire('خطأ!', err.response?.data?.detail || 'فشل في إنشاء الاختبار. قد يكون كود الاختبار مستخدماً.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'حذف الاختبار سيؤدي لمسح جميع الأسئلة ونتائج الطلاب نهائياً!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteExam(examId, token);
          setExams(prev => prev.filter(e => e.id !== examId));
          Swal.fire('تم الحذف!', 'تم حذف الاختبار بنجاح.', 'success');
        } catch (err) {
          Swal.fire('خطأ!', 'فشل في حذف الاختبار.', 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#090d16' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <Link to="/admin/dashboard" className="nav-brand">
          منصة الاختبارات <span>لوحة التحكم</span>
        </Link>
        <div className="nav-links">
          <Link to="/admin/dashboard" className="nav-btn">الرئيسية</Link>
          <Link to="/admin/exams" className="nav-btn active">إدارة الاختبارات</Link>
          <Link to="/admin/results" className="nav-btn">النتائج والتقارير</Link>
          <button onClick={handleLogout} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSignOutAlt />
            خروج
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {action === 'create' ? (
          /* CREATE EXAM VIEW */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
              <Link to="/admin/exams" style={{ color: '#94a3b8', fontSize: '1.2rem', textDecoration: 'none' }}>
                إدارة الاختبارات
              </Link>
              <FaChevronRight style={{ color: '#475569', fontSize: '0.8rem' }} />
              <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>إنشاء اختبار جديد</span>
            </div>

            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* Basic Details Box */}
              <div className="glass-card">
                <h2 style={{ fontSize: '1.2rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #f59e0b', paddingRight: '10px' }}>
                  بيانات الاختبار الأساسية
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">عنوان الاختبار *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: اختبار الرياضيات النهائي"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">كود الاختبار (اختياري - يولد عشوائياً إن تُرك فارغاً)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={examCode}
                      onChange={(e) => setExamCode(e.target.value)}
                      placeholder="مثal: MATH101"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">مدة الاختبار (بالدقائق) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">تاريخ ووقت بدء الاختبار *</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Questions Builder Box */}
              <div>
                <h2 style={{ fontSize: '1.3rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #3b82f6', paddingRight: '12px' }}>
                  بناء أسئلة الاختبار
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {questions.map((q, idx) => (
                    <div key={idx} className="glass-card" style={{ position: 'relative', padding: '25px 30px' }}>
                      
                      {/* Remove question button */}
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionField(idx)}
                          style={{
                            position: 'absolute', top: '20px', left: '20px',
                            background: 'none', border: 'none', color: '#f87171',
                            cursor: 'pointer', fontSize: '1.1rem'
                          }}
                          title="إزالة السؤال"
                        >
                          <FaTrashAlt />
                        </button>
                      )}

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                        <span style={{
                          backgroundColor: '#3b82f6', color: 'white',
                          width: '26px', height: '26px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifycontent: 'center',
                          fontWeight: 'bold', fontSize: '0.85rem'
                        }}>
                          {idx + 1}
                        </span>
                        <h4 style={{ color: 'white', fontWeight: 'bold' }}>السؤال رقم {idx + 1}</h4>
                      </div>

                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label">نص السؤال *</label>
                        <textarea
                          className="form-input"
                          value={q.question_text}
                          onChange={(e) => updateQuestionField(idx, 'question_text', e.target.value)}
                          placeholder="اكتب نص السؤال هنا..."
                          rows="2"
                          required
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      {/* Options inputs */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.85rem' }}>الاختيار أ *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={q.option_a}
                            onChange={(e) => updateQuestionField(idx, 'option_a', e.target.value)}
                            placeholder="الاختيار الأول"
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.85rem' }}>الاختيار ب *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={q.option_b}
                            onChange={(e) => updateQuestionField(idx, 'option_b', e.target.value)}
                            placeholder="الاختيار الثاني"
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.85rem' }}>الاختيار ج *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={q.option_c}
                            onChange={(e) => updateQuestionField(idx, 'option_c', e.target.value)}
                            placeholder="الاختيار الثالث"
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.85rem' }}>الاختيار د *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={q.option_d}
                            onChange={(e) => updateQuestionField(idx, 'option_d', e.target.value)}
                            placeholder="الاختيار الرابع"
                            required
                          />
                        </div>
                      </div>

                      {/* Correct answer & Marks */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">الإجابة الصحيحة *</label>
                          <select
                            className="form-input"
                            value={q.correct_answer}
                            onChange={(e) => updateQuestionField(idx, 'correct_answer', e.target.value)}
                            style={{ cursor: 'pointer' }}
                          >
                            <option value="a">الاختيار أ</option>
                            <option value="b">الاختيار ب</option>
                            <option value="c">الاختيار ج</option>
                            <option value="d">الاختيار د</option>
                          </select>
                        </div>
                        
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">علامة/درجة السؤال *</label>
                          <input
                            type="number"
                            className="form-input"
                            value={q.marks}
                            onChange={(e) => updateQuestionField(idx, 'marks', e.target.value)}
                            min="1"
                            required
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Add new question button */}
                <button
                  type="button"
                  onClick={addQuestionField}
                  className="btn btn-secondary"
                  style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', padding: '15px', justifyContent: 'center', border: '1px dashed var(--border-dark)', background: 'none', color: '#94a3b8', marginTop: '20px' }}
                >
                  <FaPlus />
                  إضافة سؤال جديد للبنك
                </button>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/admin/exams')}
                  className="btn btn-secondary"
                  disabled={submitting}
                  style={{ width: '150px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={submitting}
                  style={{ width: '200px', fontWeight: 'bold' }}
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ ونشر الاختبار'}
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* STANDARD LIST VIEW */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', color: 'white', fontWeight: '800' }}>إدارة الاختبارات</h1>
                <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>عرض وتعديل وحذف الاختبارات</p>
              </div>
              <Link to="/admin/exams?action=create" className="btn btn-accent" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FaPlus />
                إنشاء اختبار جديد
              </Link>
            </div>

            {exams.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted-dark)' }}>
                <FaClipboardList style={{ fontSize: '3rem', color: '#475569', marginBottom: '15px' }} />
                <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>لا توجد أي اختبارات مضافة بعد.</p>
                <Link to="/admin/exams?action=create" className="btn btn-primary">أنشئ أول اختبار الآن</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {exams.map(exam => {
                  const localStartStr = new Date(exam.start_time).toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={exam.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', padding: '20px 30px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: 'bold', margin: 0 }}>{exam.title}</h3>
                        
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted-dark)' }}>
                          <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>كود: {exam.exam_code}</span>
                          <span>الأسئلة: {exam.total_questions}</span>
                          <span>الدرجات: {exam.total_marks}</span>
                          <span>المدة: {exam.duration_minutes} دقيقة</span>
                          <span>تاريخ البدء: {localStartStr}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Link to={`/admin/results?exam_id=${exam.id}`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                          النتائج والمشاهدات
                        </Link>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="btn btn-danger"
                          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                        >
                          حذف الاختبار
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminExams;
