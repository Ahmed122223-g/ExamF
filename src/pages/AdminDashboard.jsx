import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaEdit, FaTrash, FaSignOutAlt, FaChartBar, FaUserGraduate, FaClipboardList, FaFileExcel, FaPlus, FaCopy, FaBook, FaArrowRight, FaVideo, FaLink } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseParam = searchParams.get('course');

  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseSections, setCourseSections] = useState([]);
  const [courseCards, setCourseCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' | 'courses' | 'projects'
  
  // Project Submissions State
  const [projectSubmissions, setProjectSubmissions] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewGrade, setReviewGrade] = useState('');
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Create Course Form Modal State
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Section Modal State
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [sectionOrder, setSectionOrder] = useState(1);
  const [savingSection, setSavingSection] = useState(false);

  const token = localStorage.getItem('admin_token');

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsData = await apiService.getDashboardStats(token);
      setStats(statsData);
      
      const examsData = await apiService.getExams(token);
      setExams(examsData);

      const coursesData = await apiService.getAdminCourses(token);
      setCourses(coursesData);

      const projectsData = await apiService.getProjectSubmissionsAdmin(token).catch(() => []);
      setProjectSubmissions(projectsData);

      if (courseParam) {
        const matched = coursesData.find(c => c.id.toString() === courseParam.toString());
        if (matched) {
          setSelectedCourse(matched);
          const sections = await apiService.getCourseSectionsAdmin(matched.id, token);
          setCourseSections(sections);
          const cards = await apiService.getCourseCardsAdmin(matched.id, token);
          setCourseCards(cards);
          setActiveTab('courses');
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        Swal.fire('خطأ!', 'فشل في تحميل بيانات لوحة التحكم.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [token, navigate, courseParam]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin/login');
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
      title: 'تم النسخ!',
      text: `كود الاختبار ${code} تم نسخه للحافظة.`,
      icon: 'success',
      timer: 1000,
      showConfirmButton: false
    });
  };

  const handleDeleteExam = async (examId) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'حذف هذا الاختبار سيؤدي إلى حذف جميع الأسئلة المرتبطة به، وحذف جميع نتائج وإجابات الطلاب نهائياً!',
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
          const statsData = await apiService.getDashboardStats(token);
          setStats(statsData);
          Swal.fire('تم الحذف!', 'تم حذف الاختبار وجميع البيانات بنجاح.', 'success');
        } catch (err) {
          Swal.fire('خطأ!', 'فشل في حذف الاختبار.', 'error');
        }
      }
    });
  };

  const handleDeleteCard = async (cardDbId) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'حذف هذا الكارت سيؤدي إلى إزالة كل تفاصيله ومقاطع الفيديو المرتبطة به نهائياً!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteCourseCardAdmin(selectedCourse.id, cardDbId, token);
          const cards = await apiService.getCourseCardsAdmin(selectedCourse.id, token);
          setCourseCards(cards);
          Swal.fire('تم الحذف!', 'تم حذف الكارت بنجاح.', 'success');
        } catch (err) {
          Swal.fire('خطأ!', 'فشل في حذف الكارت.', 'error');
        }
      }
    });
  };

  // Manage Course Content
  const handleManageCourse = async (course) => {
    try {
      setLoading(true);
      setSelectedCourse(course);
      const sections = await apiService.getCourseSectionsAdmin(course.id, token);
      setCourseSections(sections);
      const cards = await apiService.getCourseCardsAdmin(course.id, token);
      setCourseCards(cards);
    } catch (err) {
      Swal.fire('خطأ', 'فشل في جلب محتوى كروت الكورس.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourseSubmit = async (e) => {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCourseCode.trim()) {
      Swal.fire('تنبيه', 'يرجى كتابة عنوان الكورس والرمز البرمجي.', 'warning');
      return;
    }

    setCreatingCourse(true);
    try {
      await apiService.createCourse({
        title: newCourseTitle.trim(),
        course_code: newCourseCode.trim().toUpperCase(),
        description: newCourseDesc.trim()
      }, token);

      Swal.fire('تم الإنشاء!', 'تم إنشاء الكورس بنجاح وتوليد 3 أقسام افتراضية و 21 كارت له.', 'success');
      setShowCreateCourseModal(false);
      setNewCourseTitle('');
      setNewCourseCode('');
      setNewCourseDesc('');
      fetchData();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في إنشاء الكورس.', 'error');
    } finally {
      setCreatingCourse(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await apiService.getProjectSubmissionsAdmin(token);
      setProjectSubmissions(data);
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', 'فشل في تحميل تسليمات المشاريع.', 'error');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    if (reviewStatus === 'rejected' && !reviewFeedback.trim()) {
      Swal.fire('تنبيه', 'يجب كتابة ملاحظة توضح سبب الرفض.', 'warning');
      return;
    }
    try {
      setSubmittingReview(true);
      await apiService.reviewProjectSubmissionAdmin(selectedSubmission.id, {
        status: reviewStatus,
        grade: parseInt(reviewGrade) || 0,
        feedback_note: reviewFeedback.trim() || null
      }, token);
      Swal.fire('تم التقييم!', 'تم حفظ تقييم المشروع بنجاح.', 'success');
      setReviewModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في حفظ التقييم.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Section CRUD Functions
  const openAddSectionModal = () => {
    setEditingSection(null);
    setSectionTitle('');
    setSectionDesc('');
    setSectionOrder(courseSections.length + 1);
    setShowSectionModal(true);
  };

  const openEditSectionModal = (sec) => {
    setEditingSection(sec);
    setSectionTitle(sec.title || '');
    setSectionDesc(sec.description || '');
    setSectionOrder(sec.order || 1);
    setShowSectionModal(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim()) {
      Swal.fire('تنبيه', 'يرجى كتابة عنوان القسم.', 'warning');
      return;
    }
    setSavingSection(true);
    try {
      if (editingSection) {
        await apiService.updateCourseSectionAdmin(selectedCourse.id, editingSection.id, {
          title: sectionTitle.trim(),
          description: sectionDesc.trim(),
          order: parseInt(sectionOrder) || 1
        }, token);
        Swal.fire('تم التعديل!', 'تم تحديث القسم بنجاح.', 'success');
      } else {
        await apiService.createCourseSectionAdmin(selectedCourse.id, {
          title: sectionTitle.trim(),
          description: sectionDesc.trim(),
          order: parseInt(sectionOrder) || 1
        }, token);
        Swal.fire('تم الإنشاء!', 'تم إنشاء القسم بنجاح.', 'success');
      }
      setShowSectionModal(false);
      const sections = await apiService.getCourseSectionsAdmin(selectedCourse.id, token);
      setCourseSections(sections);
    } catch (err) {
      Swal.fire('خطأ', 'فشل في حفظ القسم.', 'error');
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (secId) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'حذف القسم سيؤدي إلى حذف هذا القسم وجميع الكروت والدروس المترابطة به نهائياً!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteCourseSectionAdmin(selectedCourse.id, secId, token);
          const sections = await apiService.getCourseSectionsAdmin(selectedCourse.id, token);
          setCourseSections(sections);
          const cards = await apiService.getCourseCardsAdmin(selectedCourse.id, token);
          setCourseCards(cards);
          Swal.fire('تم الحذف!', 'تم حذف القسم بنجاح.', 'success');
        } catch (err) {
          Swal.fire('خطأ!', 'فشل في حذف القسم.', 'error');
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

  // Manage Course Sections dynamic view
  if (selectedCourse) {
    return (
      <div className="app-container">
        {/* Top Navbar */}
        <nav className="navbar">
          <Link to="/admin/dashboard" className="nav-brand">
            منصة الاختبارات الإلكترونية <span>لوحة التحكم</span>
          </Link>
          <div className="nav-links">
            <button onClick={() => setSelectedCourse(null)} className="nav-btn">
              <FaArrowRight /> العودة للكورسات
            </button>
            <button onClick={handleLogout} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaSignOutAlt /> خروج
            </button>
          </div>
        </nav>

        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: 'white', fontWeight: '800' }}>محتوى كورس: {selectedCourse.title} ({selectedCourse.course_code})</h1>
              <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>تعديل الأقسام والدروس وربط المحاضرات والاختبارات.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-accent" 
                onClick={openAddSectionModal}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <FaPlus /> إضافة قسم جديد
              </button>
              <button 
                className="btn" 
                onClick={() => navigate(`/admin/courses/${selectedCourse.id}/cards/new`)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#10b981', color: 'white' }}
              >
                <FaPlus /> إضافة كارت جديد
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedCourse(null)}>
                العودة لقائمة الكورسات
              </button>
            </div>
          </div>

          {courseSections.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'white', fontSize: '1.1rem', marginBottom: '15px' }}>لا توجد أي أقسام مضافة لهذا الكورس بعد.</p>
              <button className="btn btn-primary" onClick={openAddSectionModal}>أضف أول قسم الآن</button>
            </div>
          ) : (
            <>
              {courseSections.map((sec, secIdx) => {
                const secCards = courseCards.filter(c => c.section_id === sec.id);
                const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b'];
                const borderColor = colors[secIdx % colors.length];

                return (
                  <div key={sec.id} className="glass-card" style={{ marginBottom: '30px', padding: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '800', borderRight: `4px solid ${borderColor}`, paddingRight: '10px' }}>
                          {sec.title}
                        </h2>
                        {sec.description && (
                          <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', marginTop: '5px', paddingRight: '14px' }}>
                            {sec.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn" 
                          onClick={() => openEditSectionModal(sec)}
                          style={{ padding: '5px 12px', fontSize: '0.8rem', backgroundColor: '#3b82f6', color: 'white' }}
                        >
                          تعديل القسم
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDeleteSection(sec.id)}
                          style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                        >
                          حذف القسم
                        </button>
                      </div>
                    </div>

                    {secCards.length === 0 ? (
                      <p style={{ color: '#4b5563', fontSize: '0.9rem', fontStyle: 'italic', paddingRight: '14px', marginTop: '10px' }}>
                        لا توجد كروت أو دروس مضافة في هذا القسم بعد.
                      </p>
                    ) : (
                      <div className="responsive-grid-2" style={{ marginTop: '15px' }}>
                        {secCards.map(card => {
                          const isLinked = exams.some(e => e.course_card_id === card.id);
                          return (
                            <div key={card.id} className="stat-card" style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', background: 'rgba(255,255,255,0.02)', padding: '15px' }} onClick={() => navigate(`/admin/courses/${selectedCourse.id}/cards/${card.card_id}`)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                  <span className="badge badge-success">خطوة {card.order}</span>
                                  {card.unlock_date && <span className="badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>يفتح: {card.unlock_date}</span>}
                                  {card.unlock_days !== null && card.unlock_days !== undefined && <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>يفتح بعد: {card.unlock_days} يوم</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                  {isLinked && <span className="badge badge-warning">مرتبط باختبار</span>}
                                  <button 
                                    className="btn btn-danger" 
                                    style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCard(card.id);
                                    }}
                                    title="حذف الكارت"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>{card.title}</h3>
                              <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '38px' }}>
                                {card.description || 'بدون وصف.'}
                              </p>
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px', fontSize: '0.85rem', color: '#06b6d4', display: 'flex', justifyContent: 'space-between' }}>
                                <span>إدارة الفيديوهات والاختبارات</span>
                                <span>تعديل ←</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unassigned cards (section_id = null or points to deleted section) */}
              {(() => {
                const sectionIds = new Set(courseSections.map(s => s.id));
                const unassignedCards = courseCards.filter(c => !c.section_id || !sectionIds.has(c.section_id));
                if (unassignedCards.length === 0) return null;
                return (
                  <div className="glass-card" style={{ marginBottom: '30px', padding: '25px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', color: '#f59e0b', fontWeight: '800', borderRight: '4px solid #f59e0b', paddingRight: '10px' }}>
                          ⚠️ كروت غير مُصنّفة ({unassignedCards.length})
                        </h2>
                        <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', marginTop: '5px', paddingRight: '14px' }}>
                          هذه الكروت ليس لها قسم محدد — اضغط عليها وعيّن لها قسماً من صفحة التعديل.
                        </p>
                      </div>
                    </div>
                    <div className="responsive-grid-2" style={{ marginTop: '15px' }}>
                      {unassignedCards.map(card => {
                        const isLinked = exams.some(e => e.course_card_id === card.id);
                        return (
                          <div key={card.id} className="stat-card" style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', background: 'rgba(245, 158, 11, 0.03)', padding: '15px', border: '1px solid rgba(245, 158, 11, 0.2)' }} onClick={() => navigate(`/admin/courses/${selectedCourse.id}/cards/${card.card_id}`)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="badge badge-success">خطوة {card.order}</span>
                                <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>بدون قسم</span>
                                {card.unlock_date && <span className="badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}>يفتح: {card.unlock_date}</span>}
                              </div>
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                {isLinked && <span className="badge badge-warning">مرتبط باختبار</span>}
                                <button 
                                  className="btn btn-danger" 
                                  style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCard(card.id);
                                  }}
                                  title="حذف الكارت"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>{card.title}</h3>
                            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.85rem', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '38px' }}>
                              {card.description || 'بدون وصف.'}
                            </p>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px', fontSize: '0.85rem', color: '#f59e0b', display: 'flex', justifyContent: 'space-between' }}>
                              <span>اضغط لتعيين قسم لهذا الكارت</span>
                              <span>تعديل ←</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Section Create/Edit Modal */}
          {showSectionModal && (
            <div className="roadmap-modal-overlay">
              <div className="roadmap-modal-content" style={{ background: '#111827' }}>
                <button className="roadmap-modal-close" onClick={() => setShowSectionModal(false)}>×</button>
                <h2 style={{ color: 'white', marginBottom: '20px', fontWeight: 'bold' }}>
                  {editingSection ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
                </h2>
                <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">اسم القسم</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={sectionTitle} 
                      onChange={(e) => setSectionTitle(e.target.value)} 
                      placeholder="مثال: الأساسيات والمدخلات الأولى"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">الوصف (اختياري)</label>
                    <textarea 
                      className="form-input" 
                      style={{ minHeight: '80px', resize: 'vertical' }}
                      value={sectionDesc} 
                      onChange={(e) => setSectionDesc(e.target.value)} 
                      placeholder="توضيح عام لما يغطيه هذا القسم للطلاب"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ترتيب القسم في خارطة الطريق</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      value={sectionOrder} 
                      onChange={(e) => setSectionOrder(e.target.value)} 
                      placeholder="مثال: 1"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-accent" style={{ flex: 1 }} disabled={savingSection}>
                      {savingSection ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ width: '100px' }} onClick={() => setShowSectionModal(false)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <Link to="/admin/dashboard" className="nav-brand">
          منصة الاختبارات الإلكترونية <span>لوحة التحكم</span>
        </Link>
        <div className="nav-links">
          <button onClick={() => setActiveTab('exams')} className={`nav-btn ${activeTab === 'exams' ? 'active' : ''}`}>إدارة الاختبارات</button>
          <button onClick={() => { setActiveTab('courses'); setSelectedCourse(null); }} className={`nav-btn ${activeTab === 'courses' ? 'active' : ''}`}>إدارة الكورسات والخرائط</button>
          <button onClick={() => { setActiveTab('projects'); fetchProjects(); }} className={`nav-btn ${activeTab === 'projects' ? 'active' : ''}`}>مراجعة المشاريع</button>
          <Link to="/admin/results" className="nav-btn">النتائج والتقارير</Link>
          <Link to="/admin/students" className="nav-btn">👥 الطلاب والتنبيهات</Link>
          <button onClick={handleLogout} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSignOutAlt /> خروج
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        
        {activeTab === 'exams' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800' }}>مرحباً بك في لوحة تحكم المسؤول 👋</h1>
                <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>إحصائيات المنصة وأحدث الاختبارات النشطة</p>
              </div>
              <Link to="/admin/exams?action=create" className="btn btn-accent" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FaPlus /> إنشاء اختبار جديد
              </Link>
            </div>

            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                    <FaClipboardList />
                  </div>
                  <div className="stat-info">
                    <h3>إجمالي الاختبارات</h3>
                    <p>{stats.total_exams}</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                    <FaUserGraduate />
                  </div>
                  <div className="stat-info">
                    <h3>عدد مشاركات الطلاب</h3>
                    <p>{stats.total_submissions}</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                    <FaChartBar />
                  </div>
                  <div className="stat-info">
                    <h3>متوسط درجات الطلاب</h3>
                    <p>{stats.average_percentage}%</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
                    ⚡
                  </div>
                  <div className="stat-info">
                    <h3>اختبارات جارية الآن</h3>
                    <p>{stats.active_exams_count}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: '25px' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #3b82f6', paddingRight: '10px' }}>
                جدول الاختبارات المتاحة
              </h2>

              {exams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted-dark)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>لا توجد أي اختبارات منشأة حالياً.</p>
                  <Link to="/admin/exams?action=create" className="btn btn-primary">أنشئ أول اختبار الآن</Link>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>كود الاختبار</th>
                        <th>عنوان الاختبار</th>
                        <th>تاريخ ووقت البدء (UTC)</th>
                        <th>مدة الاختبار</th>
                        <th>الأسئلة</th>
                        <th>الدرجة الكلية</th>
                        <th style={{ textAlign: 'center' }}>العمليات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map(exam => {
                        const localStartStr = new Date(exam.start_time).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <tr key={exam.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '1px' }}>
                                  {exam.exam_code}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(exam.exam_code)}
                                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                                  title="نسخ كود الاختبار"
                                >
                                  <FaCopy />
                                </button>
                              </div>
                            </td>
                            <td><strong>{exam.title}</strong></td>
                            <td>{localStartStr}</td>
                            <td>{exam.duration_minutes} دقيقة</td>
                            <td>{exam.total_questions} أسئلة</td>
                            <td>{exam.total_marks} درجة</td>
                            <td>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <Link to={`/admin/results?exam_id=${exam.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                  النتائج
                                </Link>
                                <Link to={`/admin/exams/${exam.id}/stats`} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#8b5cf6', color: 'white' }}>
                                  الإحصائيات
                                </Link>
                                <a 
                                  href={apiService.getExportUrl(exam.id)}
                                  className="btn"
                                  style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#10b981', color: 'white' }}
                                  title="تحميل شيت إكسيل"
                                >
                                  <FaFileExcel />
                                </a>
                                <button
                                  onClick={() => handleDeleteExam(exam.id)}
                                  className="btn btn-danger"
                                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                  title="حذف الاختبار"
                                >
                                  <FaTrash />
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
          </>
        ) : activeTab === 'projects' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800' }}>مراجعة وتقييم المشاريع 🏆</h1>
                <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>تقييم وتصحيح حلول المشاريع المرفوعة من قبل الطلاب وإرسال الملاحظات والدرجات</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '25px' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #06b6d4', paddingRight: '10px' }}>
                طلبات تسليم المشاريع المعلقة والمكتملة
              </h2>

              {loadingProjects ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><div className="spinner"></div></div>
              ) : projectSubmissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted-dark)' }}>
                  <p style={{ fontSize: '1.1rem' }}>لا توجد أي مشاريع مرفوعة للمراجعة حالياً.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>كارت المشروع</th>
                        <th>تاريخ الرفع</th>
                        <th>الدرجة</th>
                        <th>الحالة</th>
                        <th style={{ textAlign: 'center' }}>العمليات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectSubmissions.map(sub => {
                        const submittedStr = new Date(sub.submitted_at).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <tr key={sub.id}>
                            <td><strong>{sub.student_name}</strong></td>
                            <td>{sub.card_title}</td>
                            <td>{submittedStr}</td>
                            <td>{sub.grade !== null ? `${sub.grade} درجة` : 'لم يقيم بعد'}</td>
                            <td>
                              <span className={`status-badge ${sub.status}`} style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                backgroundColor: sub.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : sub.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: sub.status === 'approved' ? '#10b981' : sub.status === 'rejected' ? '#ef4444' : '#f59e0b'
                              }}>
                                {sub.status === 'approved' ? 'مقبول ✅' : sub.status === 'rejected' ? 'مرفوض ❌' : 'قيد المراجعة ⏳'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => {
                                    setSelectedSubmission(sub);
                                    setReviewGrade(sub.grade !== null ? sub.grade.toString() : '');
                                    setReviewStatus(sub.status || 'approved');
                                    setReviewFeedback(sub.feedback_note || '');
                                    setReviewModalOpen(true);
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                >
                                  استعراض وتقييم
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
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800' }}>إدارة الكورسات وخرائط الطريق 🗺️</h1>
                <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>إضافة كورس جديد بمحددات مخصصة والتحكم في دروس ومهام الفترات التدريبية</p>
              </div>
              <button onClick={() => setShowCreateCourseModal(true)} className="btn btn-accent" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FaPlus /> إضافة كورس جديد
              </button>
            </div>

            <div className="glass-card" style={{ padding: '25px' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'white', fontWeight: '800', marginBottom: '20px', borderRight: '4px solid #06b6d4', paddingRight: '10px' }}>
                قائمة الكورسات التدريبية الحالية
              </h2>

              {courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted-dark)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>لا توجد أي كورسات منشأة حالياً.</p>
                  <button className="btn btn-primary" onClick={() => setShowCreateCourseModal(true)}>أنشئ أول كورس الآن</button>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>رمز الكورس</th>
                        <th>اسم الكورس</th>
                        <th>الوصف العام</th>
                        <th style={{ textAlign: 'center' }}>العمليات لإدارة المحتوى</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map(course => (
                        <tr key={course.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '1px' }}>
                                {course.course_code}
                              </span>
                              <button
                                onClick={() => handleCopyCode(course.course_code)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
                                title="نسخ كود الكورس للطلاب"
                              >
                                <FaCopy />
                              </button>
                            </div>
                          </td>
                          <td><strong>{course.title}</strong></td>
                          <td>{course.description || 'لا يوجد وصف.'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => handleManageCourse(course)}
                                className="btn btn-primary" 
                                style={{ padding: '6px 15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                              >
                                <FaBook /> إدارة المحتوى والخرائط
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Create Course Modal */}
            {showCreateCourseModal && (
              <div className="roadmap-modal-overlay">
                <div className="roadmap-modal-content" style={{ background: '#111827' }}>
                  <button className="roadmap-modal-close" onClick={() => setShowCreateCourseModal(false)}>×</button>
                  <h2 style={{ color: 'white', marginBottom: '20px', fontWeight: 'bold' }}>إضافة كورس تدريبي جديد</h2>
                  <form onSubmit={handleCreateCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                      <label className="form-label">اسم الكورس</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        value={newCourseTitle} 
                        onChange={(e) => setNewCourseTitle(e.target.value)} 
                        placeholder="مثال: أساسيات C++ الاحترافية"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">رمز الكورس البرمجي (Course Code)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        value={newCourseCode} 
                        onChange={(e) => setNewCourseCode(e.target.value)} 
                        placeholder="مثال: CPP101"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">الوصف العام</label>
                      <textarea 
                        className="form-input" 
                        style={{ minHeight: '80px', resize: 'vertical' }}
                        value={newCourseDesc} 
                        onChange={(e) => setNewCourseDesc(e.target.value)} 
                        placeholder="وصف مختصر لمراحل ونتائج التعلم من الكورس"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                      <button type="submit" className="btn btn-accent" style={{ flex: 1 }} disabled={creatingCourse}>
                        {creatingCourse ? 'جاري الإنشاء...' : 'تأكيد إضافة الكورس'}
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ width: '100px' }} onClick={() => setShowCreateCourseModal(false)}>
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

      {/* Review Project Modal */}
      {reviewModalOpen && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%', direction: 'rtl', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', maxHeight: '90vh' }}>
            <h3 className="modal-title" style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
              📝 مراجعة وتقييم مشروع: {selectedSubmission.card_title}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>اسم الطالب:</p>
                <p style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedSubmission.student_name}</p>
              </div>

              {selectedSubmission.solution_text && (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px' }}>💻 الكود أو شرح الحل المقدم:</p>
                  <pre style={{
                    background: 'rgba(0,0,0,0.4)',
                    color: '#10b981',
                    padding: '15px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {selectedSubmission.solution_text}
                  </pre>
                </div>
              )}

              {selectedSubmission.solution_file_name && (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px' }}>📂 الملف المرفوع:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{selectedSubmission.solution_file_name}</span>
                    <button
                      onClick={() => {
                        try {
                          const link = document.createElement('a');
                          link.href = selectedSubmission.solution_file_base64 || '';
                          link.download = selectedSubmission.solution_file_name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } catch (e) {
                          Swal.fire('خطأ', 'فشل في تحميل الملف.', 'error');
                        }
                      }}
                      className="btn"
                      style={{ backgroundColor: '#0284c7', color: 'white', padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      تحميل الملف
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>التقييم والدرجة</label>
                    <input
                      type="number"
                      className="form-input"
                      value={reviewGrade}
                      onChange={e => setReviewGrade(e.target.value)}
                      placeholder="أدخل درجة الطالب في المشروع"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>حالة المشروع</label>
                    <select
                      className="form-input"
                      value={reviewStatus}
                      onChange={e => setReviewStatus(e.target.value)}
                    >
                      <option value="approved">مقبول ومكتمل (Approved)</option>
                      <option value="rejected">مرفوض للتعديل (Rejected)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#94a3b8', display: 'block', marginBottom: '5px' }}>
                    📝 ملاحظات أو سبب الرفض:
                    {reviewStatus === 'rejected' && <span style={{ color: '#ef4444' }}> (مطلوب عند الرفض)</span>}
                  </label>
                  <textarea
                    className="form-input"
                    value={reviewFeedback}
                    onChange={e => setReviewFeedback(e.target.value)}
                    placeholder="اكتب ملاحظاتك للطالب، أسباب الرفض أو نصائح لتحسين الكود"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    required={reviewStatus === 'rejected'}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setReviewModalOpen(false)} className="btn btn-secondary">إلغاء</button>
                  <button type="submit" disabled={submittingReview} className="btn btn-accent">
                    {submittingReview ? 'جاري حفظ التقييم...' : 'حفظ وإرسال التقييم'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
};

export default AdminDashboard;
