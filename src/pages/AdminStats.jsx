import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaArrowRight, FaClock, FaTrophy, FaUsers, FaCheckCircle, FaExclamationTriangle, FaPercentage } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        navigate('/admin/login');
        return;
      }
      try {
        const data = await apiService.getExamStats(id, token);
        setStats(data);
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'خطأ',
          text: 'فشل في تحميل إحصائيات الاختبار.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [id, navigate]);

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'غير متوفر';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} دقيقة و ${s} ثانية`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
        <h2>لم يتم العثور على إحصائيات لهذا الاختبار.</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/dashboard')}>العودة للرئيسية</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 15px', direction: 'rtl', color: 'white' }}>
      
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'none', 
              border: 'none', 
              color: 'var(--accent-color)', 
              cursor: 'pointer', 
              fontSize: '1rem',
              fontWeight: 'bold',
              padding: 0,
              marginBottom: '10px'
            }}
          >
            <FaArrowRight /> العودة للوحة التحكم
          </button>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
            إحصائيات وتحليلات: <span style={{ color: 'var(--accent-color)' }}>{stats.exam_title}</span>
          </h1>
        </div>
      </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '15px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex' }}>
            <FaUsers />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem' }}>إجمالي المشاركين</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{stats.total_participants}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-dark)' }}>تم تسليم {stats.total_submitted} محاولة</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '15px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex' }}>
            <FaPercentage />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem' }}>متوسط الدرجات</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{stats.average_score} <span style={{ fontSize: '1rem', color: 'var(--text-muted-dark)' }}>/ {stats.total_marks}</span></div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
              نسبة نجاح: {stats.total_submitted > 0 ? `${((stats.leaderboard.filter(x => x.status === 'ناجح').length / stats.total_submitted) * 100).toFixed(1)}%` : '0%'}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '15px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex' }}>
            <FaTrophy />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem' }}>الأول على الدفعة 🏆</div>
            {stats.best_student ? (
              <>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={stats.best_student.student_name}>
                  {stats.best_student.student_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)' }}>
                  الدرجة: {stats.best_student.score} / {stats.total_marks}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '1rem', color: 'var(--text-muted-dark)' }}>لا يوجد نتائج</div>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', padding: '15px', borderRadius: '12px', fontSize: '1.5rem', display: 'flex' }}>
            <FaClock />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem' }}>الأسرع حلاً ⚡</div>
            {stats.fastest_student ? (
              <>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={stats.fastest_student.student_name}>
                  {stats.fastest_student.student_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#8b5cf6' }}>
                  الزمن: {formatDuration(stats.fastest_student.duration_seconds)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '1rem', color: 'var(--text-muted-dark)' }}>لا يوجد نتائج</div>
            )}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginBottom: '40px' }}>
        
                <div className="glass-card" style={{ padding: '25px' }}>
          <h2 style={{ fontSize: '1.3rem', borderBottom: '1px solid var(--border-dark)', paddingBottom: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏆 لوحة الصدارة وترتيب الطلاب ({stats.leaderboard.length})
          </h2>
          {stats.leaderboard.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted-dark)', padding: '20px 0' }}>لا يوجد درجات أو محاولات مكتملة لعرضها بعد.</p>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', textAlign: 'right' }}>
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>الترتيب</th>
                    <th>اسم الطالب</th>
                    <th style={{ textAlign: 'center' }}>الدرجة</th>
                    <th style={{ textAlign: 'center' }}>التقدير</th>
                    <th style={{ textAlign: 'center' }}>الزمن المستغرق</th>
                    <th style={{ textAlign: 'center' }}>الحالة</th>
                    <th style={{ textAlign: 'center' }}>محاولة الغش</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.leaderboard.map((student) => (
                    <tr key={student.id} style={{ 
                      backgroundColor: student.rank === 1 ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                      borderLeft: student.rank === 1 ? '3px solid #f59e0b' : 'none'
                    }}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : student.rank}
                      </td>
                      <td>
                        <strong>{student.student_name}</strong>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {student.score} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)', fontWeight: 'normal' }}>/ {stats.total_marks}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          color: student.status === 'ناجح' ? '#10b981' : '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          {student.grade}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted-dark)' }}>
                        {formatDuration(student.duration_seconds)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '4px 10px', 
                          borderRadius: '50px', 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold', 
                          backgroundColor: student.status === 'ناجح' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                          color: student.status === 'ناجح' ? '#10b981' : '#ef4444' 
                        }}>
                          {student.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {student.is_cheated ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <FaExclamationTriangle /> نعم (تم رصده)
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.85rem' }}>لا توجد مخالفة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

                <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📊 تحليل إجابات الأسئلة ونسب الاختيار
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {stats.questions.map((q, index) => {
              const dist = q.distribution;
              let mostSelectedKey = 'no_answer';
              let maxVal = -1;
              Object.keys(dist).forEach(k => {
                if (dist[k] > maxVal) {
                  maxVal = dist[k];
                  mostSelectedKey = k;
                }
              });

              return (
                <div key={q.id} className="glass-card" style={{ padding: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white', margin: 0, flex: 1 }}>
                      سؤال {index + 1}: {q.question_text}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        padding: '4px 10px', 
                        borderRadius: '50px', 
                        backgroundColor: q.correct_percentage >= 70 ? 'rgba(16, 185, 129, 0.15)' : q.correct_percentage >= 40 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: q.correct_percentage >= 70 ? '#10b981' : q.correct_percentage >= 40 ? '#f59e0b' : '#ef4444',
                        fontWeight: 'bold'
                      }}>
                        نسبة الحل الصحيح: {q.correct_percentage}%
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted-dark)' }}>
                        ({q.correct_answers_count} من {q.total_answers} طلاب)
                      </span>
                    </div>
                  </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                    
                    {[
                      { key: 'a', text: q.option_a, label: 'أ' },
                      { key: 'b', text: q.option_b, label: 'ب' },
                      { key: 'c', text: q.option_c, label: 'ج' },
                      { key: 'd', text: q.option_d, label: 'د' }
                    ].map((opt) => {
                      const isCorrect = q.correct_answer.toLowerCase() === opt.key;
                      const pct = q.distribution[opt.key] || 0;
                      const isMostPopularIncorrect = !isCorrect && mostSelectedKey === opt.key && pct > 0;

                      return (
                        <div key={opt.key} style={{ 
                          padding: '12px 15px', 
                          borderRadius: '8px', 
                          backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: isCorrect ? '1px dashed #10b981' : isMostPopularIncorrect ? '1px dashed #f59e0b' : '1px solid transparent',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                                                    <div style={{ 
                            position: 'absolute', 
                            top: 0, 
                            right: 0, 
                            bottom: 0, 
                            width: `${pct}%`, 
                            backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                            zIndex: 1,
                            transition: 'width 0.5s ease-out'
                          }}></div>

                                                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ 
                                display: 'inline-flex', 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                border: isCorrect ? '2px solid #10b981' : '2px solid var(--text-muted-dark)',
                                color: isCorrect ? '#10b981' : 'white',
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}>
                                {opt.label}
                              </span>
                              <span>{opt.text}</span>
                              {isCorrect && (
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '50px', backgroundColor: '#10b981', color: 'white', marginRight: '8px', fontWeight: 'bold' }}>
                                  الإجابة الصحيحة
                                </span>
                              )}
                              {isMostPopularIncorrect && (
                                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '50px', backgroundColor: '#f59e0b', color: 'black', marginRight: '8px', fontWeight: 'bold' }}>
                                  الخطأ الأكثر شيوعاً
                                </span>
                              )}
                            </div>
                            <span style={{ fontWeight: 'bold', color: isCorrect ? '#10b981' : 'white' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}

                                        {q.distribution.no_answer > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted-dark)', padding: '5px 10px' }}>
                        <span>⚠️ لم يجب أحد على هذا السؤال:</span>
                        <span style={{ fontWeight: 'bold' }}>{q.distribution.no_answer}%</span>
                      </div>
                    )}

                  </div>

                                    {q.explanation && (
                    <div style={{ 
                      marginTop: '15px', 
                      padding: '12px 15px', 
                      borderRadius: '8px', 
                      backgroundColor: 'rgba(59, 130, 246, 0.05)', 
                      borderRight: '3px solid #3b82f6', 
                      fontSize: '0.9rem',
                      color: 'var(--text-muted-dark)'
                    }}>
                      <strong>💡 شرح الإجابة:</strong> {q.explanation}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminStats;
