import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaSave, FaArrowRight, FaVideo, FaLink, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminEditCard = () => {
  const { courseId, cardId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  const [course, setCourse] = useState(null);
  const [card, setCard] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Card details state
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardPhase, setCardPhase] = useState('basics');
  const [cardOrder, setCardOrder] = useState(1);
  const [cardInstructors, setCardInstructors] = useState({});
  const [linkedExamId, setLinkedExamId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Get all courses to find the current one
        const coursesData = await apiService.getAdminCourses(token);
        const currentCourse = coursesData.find(c => c.id.toString() === courseId.toString());
        if (!currentCourse) {
          Swal.fire('خطأ', 'الكورس غير موجود.', 'error');
          navigate('/admin/dashboard');
          return;
        }
        setCourse(currentCourse);

        // Get cards for this course to find the specific card
        const cardsData = await apiService.getCourseCardsAdmin(courseId, token);
        const currentCard = cardsData.find(c => c.card_id === cardId || c.id.toString() === cardId.toString());
        if (!currentCard) {
          Swal.fire('خطأ', 'الكارت غير موجود.', 'error');
          navigate('/admin/dashboard');
          return;
        }
        setCard(currentCard);

        // Fill state values
        setCardTitle(currentCard.title || '');
        setCardDesc(currentCard.description || '');
        setCardPhase(currentCard.phase || 'basics');
        setCardOrder(currentCard.order || 1);

        // Parse instructors JSON
        let instructorsObj = {};
        if (currentCard.instructors_data) {
          try {
            instructorsObj = JSON.parse(currentCard.instructors_data);
          } catch (e) {
            instructorsObj = {};
          }
        }
        setCardInstructors(instructorsObj);

        // Get exams list for linking dropdown
        const examsData = await apiService.getExams(token);
        setExams(examsData);

        // Find linked exam if any
        const linkedExam = examsData.find(e => e.course_card_id === currentCard.id);
        setLinkedExamId(linkedExam ? linkedExam.id.toString() : '');

      } catch (err) {
        console.error(err);
        Swal.fire('خطأ', 'فشل في تحميل البيانات.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, cardId, token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin/login');
  };

  const handleUpdateInstructorName = (key, val) => {
    setCardInstructors(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        name: val
      }
    }));
  };

  const handleAddVideo = (instructorKey) => {
    setCardInstructors(prev => {
      const instructor = prev[instructorKey] || { name: '', videos: [] };
      const currentVideos = instructor.videos || [];
      const newIndex = currentVideos.length + 1;
      return {
        ...prev,
        [instructorKey]: {
          ...instructor,
          videos: [...currentVideos, { title: `الدرس ${newIndex}`, url: '' }]
        }
      };
    });
  };

  const handleRemoveVideo = (instructorKey, index) => {
    setCardInstructors(prev => {
      const instructor = prev[instructorKey];
      if (!instructor) return prev;
      const updatedVideos = (instructor.videos || []).filter((_, i) => i !== index);
      const cleanedVideos = updatedVideos.map((vid, idx) => ({
        ...vid,
        title: `الدرس ${idx + 1}`
      }));
      return {
        ...prev,
        [instructorKey]: {
          ...instructor,
          videos: cleanedVideos
        }
      };
    });
  };

  const handleVideoUrlChange = (instructorKey, index, urlVal) => {
    setCardInstructors(prev => {
      const instructor = prev[instructorKey];
      if (!instructor) return prev;
      const copyVids = [...(instructor.videos || [])];
      copyVids[index].url = urlVal;
      return {
        ...prev,
        [instructorKey]: {
          ...instructor,
          videos: copyVids
        }
      };
    });
  };

  const handleSave = async () => {
    if (!cardTitle.trim()) {
      Swal.fire('تنبيه', 'يرجى تحديد عنوان الكارت.', 'warning');
      return;
    }

    setSaving(true);
    try {
      // 1. Update Card Info
      await apiService.updateCourseCardAdmin(courseId, card.card_id, {
        card_id: card.card_id,
        title: cardTitle.trim(),
        description: cardDesc.trim(),
        phase: cardPhase,
        order: parseInt(cardOrder),
        instructors_data: JSON.stringify(cardInstructors)
      }, token);

      // 2. Update Exam Linkage
      if (linkedExamId) {
        await apiService.linkExamToCourse(parseInt(linkedExamId), parseInt(courseId), card.id, token);
      } else {
        const currentlyLinkedExams = exams.filter(e => e.course_card_id === card.id);
        for (const ex of currentlyLinkedExams) {
          await apiService.linkExamToCourse(ex.id, 0, 0, token);
        }
      }

      Swal.fire('تم الحفظ!', 'تم تحديث بيانات الكارت بنجاح.', 'success').then(() => {
        // Go back to the dashboard course management view
        navigate(`/admin/dashboard?course=${courseId}`);
      });
    } catch (err) {
      console.error(err);
      const errDetail = err.response?.data?.detail;
      const errorMsg = typeof errDetail === 'string'
        ? errDetail
        : (typeof errDetail === 'object' ? JSON.stringify(errDetail) : 'فشل في حفظ الكارت.');
      Swal.fire('خطأ', errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#090d16' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!course || !card) return null;

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <Link to="/admin/dashboard" className="nav-brand">
          منصة الاختبارات الإلكترونية <span>لوحة التحكم</span>
        </Link>
        <div className="nav-links">
          <button onClick={() => navigate(`/admin/dashboard?course=${courseId}`)} className="nav-btn">
            <FaArrowRight /> العودة لخرائط الكورس
          </button>
          <button onClick={handleLogout} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSignOutAlt /> خروج
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content" style={{ maxWidth: '900px', margin: '40px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800' }}>تعديل كارت: {card.title}</h1>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>كورس: {course.title} ({course.course_code}) • خطوة {cardOrder}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate(`/admin/dashboard?course=${courseId}`)}>
            إلغاء والعودة
          </button>
        </div>

        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>العنوان</label>
            <input type="text" className="form-input" value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>الوصف</label>
            <textarea className="form-input" style={{ minHeight: '100px', resize: 'vertical' }} value={cardDesc} onChange={(e) => setCardDesc(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>المرحلة (Phase)</label>
              <select className="form-input" value={cardPhase} onChange={(e) => setCardPhase(e.target.value)}>
                <option value="basics">الأساسيات</option>
                <option value="oop">OOP</option>
                <option value="dsa">DSA</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>الترتيب</label>
              <input type="number" className="form-input" value={cardOrder} onChange={(e) => setCardOrder(parseInt(e.target.value) || 1)} />
            </div>
          </div>

          {/* Linking Exam */}
          <div className="form-group" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '20px', borderRadius: '12px' }}>
            <label className="form-label" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <FaLink /> ربط اختبار بهذا الكارت تلقائياً للطلاب:
            </label>
            <select 
              className="form-input" 
              value={linkedExamId} 
              onChange={(e) => setLinkedExamId(e.target.value)}
              style={{ marginTop: '10px', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              <option value="">-- بدون اختبار مرتبط --</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title} ({e.exam_code})</option>
              ))}
            </select>
          </div>

          {/* Instructors Section */}
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderRight: '4px solid #06b6d4', paddingRight: '10px' }}>
              <FaVideo style={{ color: '#06b6d4' }} /> روابط الفيديوهات والمحاضرين:
            </h3>
            
            {['elzero', 'abu_hadhoud', 'el_desouki'].map(key => {
              const inst = cardInstructors[key] || { name: key === 'elzero' ? 'أسامة الزيرو' : key === 'abu_hadhoud' ? 'أبو هدهود' : 'محمد الدسوقي', videos: [] };
              return (
                <div key={key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ background: 'transparent', border: 'none', color: '#06b6d4', fontWeight: 'bold', fontSize: '1.1rem', padding: 0, width: 'auto' }}
                      value={inst.name}
                      onChange={(e) => handleUpdateInstructorName(key, e.target.value)}
                    />
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => handleAddVideo(key)}>
                      + إضافة درس/فيديو
                    </button>
                  </div>

                  {inst.videos && inst.videos.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {inst.videos.map((vid, vidIdx) => (
                        <div key={vidIdx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ width: '90px', color: 'var(--text-muted-dark)', fontSize: '0.95rem', fontWeight: '500' }}>{vid.title}</span>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="رابط يوتيوب للدرس" 
                            style={{ flex: 1, padding: '10px 14px', fontSize: '0.95rem' }}
                            value={vid.url}
                            onChange={(e) => handleVideoUrlChange(key, vidIdx, e.target.value)}
                          />
                          <button type="button" className="btn btn-danger" style={{ padding: '10px 15px' }} onClick={() => handleRemoveVideo(key, vidIdx)}>
                            حذف
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#4b5563', fontSize: '0.9rem', fontStyle: 'italic' }}>لا توجد فيديوهات مضافة لهذا المحاضر بعد.</p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleSave} disabled={saving}>
              <FaSave /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
            <button className="btn btn-secondary" style={{ width: '120px' }} onClick={() => navigate(`/admin/dashboard?course=${courseId}`)}>
              إلغاء
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEditCard;
