import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaPlus, FaTrash, FaSignOutAlt, FaChevronRight, FaClipboardList, FaClock, FaCheckCircle, FaTrashAlt, FaEdit, FaMagic } from 'react-icons/fa';
import Swal from 'sweetalert2';

const formatForDateTimeInput = (isoStr) => {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const AdminExams = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action');
  const examIdParam = searchParams.get('id');

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [examCode, setExamCode] = useState('');
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [questions, setQuestions] = useState([
    { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', marks: 1, explanation: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        if (action === 'edit' && examIdParam) {
          const examData = await apiService.getExamDetails(examIdParam, token);
          setTitle(examData.title || '');
          setExamCode(examData.exam_code || '');
          setDuration(examData.duration_minutes || 30);
          setStartTime(formatForDateTimeInput(examData.start_time));
          setEndTime(formatForDateTimeInput(examData.end_time));
          if (examData.questions && examData.questions.length > 0) {
            setQuestions(examData.questions.map(q => ({
              id: q.id,
              question_text: q.question_text || '',
              option_a: q.option_a || '',
              option_b: q.option_b || '',
              option_c: q.option_c || '',
              option_d: q.option_d || '',
              correct_answer: (q.correct_answer || 'a').toLowerCase(),
              marks: q.marks || 1,
              explanation: q.explanation || ''
            })));
          }
        } else if (action === 'create') {
          setTitle('');
          setExamCode('');
          setDuration(30);
          setStartTime('');
          setEndTime('');
          setQuestions([
            { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', marks: 1, explanation: '' }
          ]);
        } else {
          const data = await apiService.getExams(token);
          setExams(data);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
        } else {
          Swal.fire('خطأ!', err.response?.data?.detail || 'فشل في تحميل البيانات.', 'error');
          if (action === 'edit') {
            navigate('/admin/exams');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, navigate, action, examIdParam]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin/login');
  };

  const addQuestionField = () => {
    setQuestions(prev => [
      ...prev,
      { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', marks: 1, explanation: '' }
    ]);
  };

  const removeQuestionField = (index) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestionField = (index, field, value) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      Swal.fire('تنبيه!', 'يرجى إكمال الحقول الأساسية للاختبار.', 'warning');
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      Swal.fire('تنبيه!', 'يجب أن يكون تاريخ ووقت انتهاء الاختبار بعد تاريخ ووقت البدء.', 'warning');
      return;
    }

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
        end_time: new Date(endTime).toISOString(),
        questions: questions.map(q => ({
          question_text: q.question_text.trim(),
          option_a: q.option_a.trim(),
          option_b: q.option_b.trim(),
          option_c: q.option_c.trim(),
          option_d: q.option_d.trim(),
          correct_answer: q.correct_answer.toLowerCase(),
          marks: parseInt(q.marks) || 1,
          explanation: q.explanation?.trim() || null
        }))
      };

      if (action === 'edit' && examIdParam) {
        await apiService.updateExam(examIdParam, payload, token);
        Swal.fire({
          title: 'تم التعديل!',
          text: 'تم تحديث بيانات وأسئلة الاختبار بنجاح.',
          icon: 'success'
        }).then(() => {
          navigate('/admin/exams');
        });
      } else {
        await apiService.createExam(payload, token);
        Swal.fire({
          title: 'تم الإنشاء!',
          text: 'تم إنشاء الاختبار وإضافة الأسئلة بنجاح.',
          icon: 'success'
        }).then(() => {
          navigate('/admin/exams');
        });
      }

    } catch (err) {
      Swal.fire('خطأ!', err.response?.data?.detail || 'فشل في حفظ الاختبار. قد يكون كود الاختبار مستخدماً.', 'error');
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
      <nav className="navbar">
        <Link to="/admin/dashboard" className="nav-brand">
          منصة الاختبارات الإلكترونية <span>لوحة التحكم</span>
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

      <main className="main-content">
        {(action === 'create' || action === 'edit') ? (
          /* CREATE OR EDIT EXAM VIEW */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
              <Link to="/admin/exams" style={{ color: '#94a3b8', fontSize: '1.2rem', textDecoration: 'none' }}>
                إدارة الاختبارات
              </Link>
              <FaChevronRight style={{ color: '#475569', fontSize: '0.8rem' }} />
              <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>
                {action === 'edit' ? 'تعديل الاختبار' : 'إنشاء اختبار جديد'}
              </span>
            </div>

            <form onSubmit={handleSubmitExam} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              <div className="glass-card">
                <h2 style={{ fontSize: '1.2rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #f59e0b', paddingRight: '10px' }}>
                  بيانات الاختبار الأساسية
                </h2>
                
                <div className="responsive-grid-2">
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
                      placeholder="مثال: MATH101"
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

                  <div className="form-group">
                    <label className="form-label">تاريخ ووقت انتهاء الاختبار *</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.3rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #3b82f6', paddingRight: '12px' }}>
                  بناء أسئلة الاختبار
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {questions.map((q, idx) => (
                    <div key={idx} className="glass-card" style={{ position: 'relative', padding: '25px 30px' }}>
                      
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
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
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

                      <div className="responsive-grid-choices" style={{ marginBottom: '20px' }}>
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

                      <div className="responsive-grid-2">
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

                      <div className="form-group" style={{ margin: 0, marginTop: '15px' }}>
                        <label className="form-label" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                          💡 شرح الإجابة (اختياري - يظهر للطالب بعد انتهاء الاختبار)
                        </label>
                        <textarea
                          className="form-input"
                          value={q.explanation || ''}
                          onChange={(e) => updateQuestionField(idx, 'explanation', e.target.value)}
                          placeholder="مثال: نختار الإجابة (أ) لأن ..."
                          rows="2"
                          style={{ resize: 'vertical', fontSize: '0.9rem' }}
                        />
                      </div>

                    </div>
                  ))}
                </div>

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
                  {submitting ? 'جاري الحفظ...' : (action === 'edit' ? 'حفظ التعديلات' : 'حفظ ونشر الاختبار')}
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* STANDARD LIST VIEW */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', color: 'white', fontWeight: '800' }}>إدارة الاختبارات</h1>
                <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>عرض وتعديل وحذف الاختبارات وإدارتها بالذكاء الاصطناعي</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link 
                  to="/admin/exams/ai-generate" 
                  className="btn" 
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    color: 'white',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.35)',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    textDecoration: 'none'
                  }}
                >
                  <FaMagic /> ✨ توليد كويز بالـ AI
                </Link>
                <Link to="/admin/exams?action=create" className="btn btn-accent" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <FaPlus /> إنشاء اختبار يدوي
                </Link>
              </div>
            </div>

            {exams.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted-dark)' }}>
                <FaClipboardList style={{ fontSize: '3rem', color: '#475569', marginBottom: '15px' }} />
                <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>لا توجد أي اختبارات مضافة بعد.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <Link to="/admin/exams/ai-generate" className="btn" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white' }}>
                    <FaMagic /> توليد كويز بالذكاء الاصطناعي
                  </Link>
                  <Link to="/admin/exams?action=create" className="btn btn-primary">أنشئ اختباراً يدوياً</Link>
                </div>
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

                  const localEndStr = exam.end_time ? new Date(exam.end_time).toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'غير محدد';

                  return (
                    <div key={exam.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', padding: '20px 30px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.25rem', color: 'white', fontWeight: 'bold', margin: 0 }}>{exam.title}</h3>
                        
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted-dark)' }}>
                          <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>كود: {exam.exam_code}</span>
                          <span>الأسئلة: {exam.total_questions}</span>
                          <span>الدرجات: {exam.total_marks}</span>
                          <span>المدة: {exam.duration_minutes} دقيقة</span>
                          <span>البدء: {localStartStr}</span>
                          <span>الانتهاء: {localEndStr}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link 
                          to={`/admin/exams?action=edit&id=${exam.id}`} 
                          className="btn" 
                          style={{ padding: '8px 16px', fontSize: '0.9rem', backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <FaEdit />
                          تعديل
                        </Link>
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
