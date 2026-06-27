import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaSignOutAlt, FaFileExcel, FaTrashAlt, FaEye, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminResults = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialExamId = searchParams.get('exam_id') || '';

  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [loading, setLoading] = useState(true);

  // Result details Modal state
  const [selectedResult, setSelectedResult] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchFiltersAndData = async () => {
      setLoading(true);
      try {
        const examsData = await apiService.getExams(token);
        setExams(examsData);
        
        const resultsData = await apiService.getResults(selectedExamId || null, token);
        setResults(resultsData);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
        } else {
          Swal.fire('خطأ!', 'فشل في تحميل النتائج.', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFiltersAndData();
  }, [token, navigate, selectedExamId]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin/login');
  };

  const handleExamChange = (e) => {
    const value = e.target.value;
    setSelectedExamId(value);
    setSearchParams(value ? { exam_id: value } : {});
  };

  const handleDeleteAttempt = async (resultId) => {
    Swal.fire({
      title: 'حذف محاولة الطالب؟',
      text: 'هذا الإجراء سيقوم بمسح نتيجة هذا الطالب وإجابته تماماً من النظام والملف المحفوظ، مما يسمح له بدخول الاختبار مرة أخرى. هل أنت متأكد؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف المحاولة',
      cancelButtonText: 'تراجع',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteAttempt(resultId, token);
          setResults(prev => prev.filter(r => r.id !== resultId));
          Swal.fire('تم حذف المحاولة!', 'بإمكان الطالب الآن إعادة دخول الاختبار مجدداً.', 'success');
        } catch (err) {
          Swal.fire('خطأ!', 'فشل في حذف محاولة الطالب.', 'error');
        }
      }
    });
  };

  const handleViewDetails = async (resultId) => {
    setModalLoading(true);
    try {
      const data = await apiService.getResultDetails(resultId, token);
      setSelectedResult(data);
    } catch (err) {
      Swal.fire('خطأ!', 'فشل في تحميل تفاصيل إجابات الطالب.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedResult(null);
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <Link to="/admin/dashboard" className="nav-brand">
          منصة الاختبارات الإلكترونية <span>لوحة التحكم</span>
        </Link>
        <div className="nav-links">
          <Link to="/admin/dashboard" className="nav-btn">الرئيسية</Link>
          <Link to="/admin/exams" className="nav-btn">إدارة الاختبارات</Link>
          <Link to="/admin/results" className="nav-btn active">النتائج والتقارير</Link>
          <button onClick={handleLogout} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSignOutAlt />
            خروج
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', color: 'white', fontWeight: '800' }}>لوحة درجات ونتائج الطلاب</h1>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>متابعة نتائج الامتحانات وتحميل ملفات الإكسيل للدرجات</p>
          </div>
        </div>

        {/* Filter controls glass card */}
        <div className="glass-card" style={{ padding: '20px 25px', marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1 }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>تصفية حسب الاختبار:</label>
            <select
              className="form-input"
              value={selectedExamId}
              onChange={handleExamChange}
              style={{ minWidth: '250px', cursor: 'pointer', margin: 0 }}
            >
              <option value="">-- كل الاختبارات المتاحة --</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title} ({e.exam_code})</option>
              ))}
            </select>
          </div>

          {selectedExamId && (
            <a
              href={apiService.getExportUrl(selectedExamId)}
              className="btn btn-primary"
              style={{ backgroundColor: '#10b981', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold' }}
            >
              <FaFileExcel />
              تصدير شيت إكسيل للدرجات
            </a>
          )}
        </div>

        {/* Results List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '25px' }}>
            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted-dark)' }}>
                لا توجد مشاركات أو نتائج مسجلة لهذا الاختبار حتى الآن.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>اسم الطالب كامل</th>
                      <th>عنوان الاختبار</th>
                      <th>الدرجة المحققة</th>
                      <th>النسبة المئوية</th>
                      <th>التقدير</th>
                      <th>الحالة</th>
                      <th>تاريخ ووقت التسليم</th>
                      <th>حالة الغش/الخروج</th>
                      <th style={{ textAlign: 'center' }}>العمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => {
                      const percent = r.total_marks > 0 ? (r.score / r.total_marks * 100) : 0;
                      const timeStr = new Date(r.submitted_at).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.student_name}</strong>
                            <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '2px' }}>{r.student_email}</div>
                          </td>
                          <td>{r.exam_title}</td>
                          <td style={{ fontWeight: 'bold' }}>{r.score} / {r.total_marks}</td>
                          <td>{percent.toFixed(1)}%</td>
                          <td>{r.grade}</td>
                          <td>
                            <span className={`badge ${r.status === 'ناجح' ? 'badge-success' : 'badge-danger'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{timeStr}</td>
                          <td>
                            {r.is_cheated ? (
                              <span className="badge badge-danger" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                                <FaExclamationTriangle />
                                نعم (غش/خروج)
                              </span>
                            ) : (
                              <span className="badge badge-success">لا</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleViewDetails(r.id)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                title="عرض ورقة الطالب الإجابية"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleDeleteAttempt(r.id)}
                                className="btn btn-danger"
                                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                title="حذف المحاولة والسماح بالإعادة"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal for viewing detailed answers */}
        {selectedResult && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(9, 13, 22, 0.85)', zIndex: 2000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
          }}>
            <div className="glass-card" style={{
              maxWidth: '850px', width: '100%', maxHeight: '90vh',
              overflowY: 'auto', position: 'relative', border: '1px solid var(--border-dark)'
            }}>
              
              {/* Close button */}
              <button
                onClick={handleCloseModal}
                style={{
                  position: 'absolute', top: '20px', left: '20px',
                  background: 'none', border: 'none', color: '#94a3b8',
                  cursor: 'pointer', fontSize: '1.25rem'
                }}
              >
                <FaTimes />
              </button>

              <h2 style={{ fontSize: '1.4rem', color: 'white', fontWeight: '800', marginBottom: '10px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '15px' }}>
                ورقة إجابة الطالب: <span style={{ color: 'var(--accent-color)' }}>{selectedResult.student_name}</span>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', marginRight: '10px', fontWeight: 'normal' }}>({selectedResult.student_email})</span>
              </h2>

              {/* Student Metadata Summary */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '15px', backgroundColor: 'rgba(30, 41, 59, 0.4)',
                padding: '15px 20px', borderRadius: '10px', border: '1px solid var(--border-dark)',
                marginBottom: '25px', fontSize: '0.9rem'
              }}>
                <div>عنوان الاختبار: <strong>{selectedResult.exam_title}</strong></div>
                <div>الدرجة: <strong>{selectedResult.score} / {selectedResult.total_marks} ({selectedResult.grade})</strong></div>
                <div>النتيجة: <strong style={{ color: selectedResult.status === 'ناجح' ? '#10b981' : '#ef4444' }}>{selectedResult.status}</strong></div>
                <div>رصد غش: <strong style={{ color: selectedResult.is_cheated ? '#ef4444' : '#10b981' }}>{selectedResult.is_cheated ? 'نعم (خروج/تقسيم شاشة)' : 'لا'}</strong></div>
              </div>

              {/* Question list with selections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {selectedResult.questions.map((q, idx) => {
                  const isCorrect = q.is_correct;
                  const isSkipped = q.selected_answer === null;

                  return (
                    <div key={q.id} style={{
                      padding: '20px', border: '1px solid var(--border-dark)', borderRadius: '10px',
                      background: isSkipped ? 'rgba(30, 41, 59, 0.2)' : (isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)'),
                      borderColor: isSkipped ? 'var(--border-dark)' : (isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <span style={{
                            backgroundColor: '#3b82f6', color: 'white',
                            width: '24px', height: '24px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0
                          }}>
                            {idx + 1}
                          </span>
                          <h4 style={{ margin: 0, color: 'white', fontSize: '0.95rem', lineHeight: '1.6' }}>{q.question_text}</h4>
                        </div>
                        <span style={{
                          padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                          backgroundColor: isSkipped ? '#334155' : (isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                          color: isSkipped ? '#94a3b8' : (isCorrect ? '#10b981' : '#ef4444')
                        }}>
                          {isSkipped ? 'غير مجاب' : (isCorrect ? `+${q.marks} درجة` : '0 درجة')}
                        </span>
                      </div>

                      {/* Choices */}
                      <div className="responsive-grid-choices" style={{ paddingRight: '15px' }}>
                        {['a', 'b', 'c', 'd'].map(optKey => {
                          const isStudentSel = q.selected_answer === optKey;
                          const isCorrectAns = q.correct_answer === optKey;

                          let borderCol = 'var(--border-dark)';
                          let bgCol = 'transparent';
                          let icon = null;

                          if (isCorrectAns) {
                            borderCol = '#10b981';
                            bgCol = 'rgba(16, 185, 129, 0.1)';
                            icon = <FaCheck style={{ color: '#10b981', fontSize: '0.8rem' }} />;
                          } else if (isStudentSel && !isCorrectAns) {
                            borderCol = '#ef4444';
                            bgCol = 'rgba(239, 68, 68, 0.1)';
                            icon = <FaTimes style={{ color: '#ef4444', fontSize: '0.8rem' }} />;
                          }

                          return (
                            <div key={optKey} style={{
                              padding: '8px 12px', border: `1px solid ${borderCol}`,
                              backgroundColor: bgCol, borderRadius: '8px',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              fontSize: '0.85rem'
                            }}>
                              <span style={{ color: isStudentSel ? 'white' : 'var(--text-muted-dark)' }}>
                                <strong>({optKey.toUpperCase()})</strong> {q[`option_${optKey}`]}
                              </span>
                              {icon}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminResults;
