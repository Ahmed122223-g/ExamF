import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FaSave, FaArrowRight, FaVideo, FaLink, FaPlus, FaTrash, FaSignOutAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminEditCard = () => {
  const { courseId, cardId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Card details state
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardPhase, setCardPhase] = useState('basics');
  const [cardOrder, setCardOrder] = useState(1);
  const [linkedExamId, setLinkedExamId] = useState('');
  const [cardSectionId, setCardSectionId] = useState(null);
  const [saving, setSaving] = useState(false);

  // New Unlock States
  const [unlockType, setUnlockType] = useState('immediate'); // 'immediate' | 'date' | 'days'
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockDays, setUnlockDays] = useState('');

  // Dynamic Instructors State
  const [instructorsList, setInstructorsList] = useState([]);

  const isNewCard = cardId === 'new';

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

        // Get exams list for linking dropdown
        const examsData = await apiService.getExams(token);
        setExams(examsData);

        if (!isNewCard) {
          // Get cards for this course to find the specific card
          const cardsData = await apiService.getCourseCardsAdmin(courseId, token);
          const currentCard = cardsData.find(c => c.card_id === cardId || c.id.toString() === cardId.toString());
          if (!currentCard) {
            Swal.fire('خطأ', 'الكارت غير موجود.', 'error');
            navigate(`/admin/dashboard?course=${courseId}`);
            return;
          }

          // Fill state values
          setCardTitle(currentCard.title || '');
          setCardDesc(currentCard.description || '');
          setCardPhase(currentCard.phase || 'basics');
          setCardOrder(currentCard.order || 1);
          setCardSectionId(currentCard.section_id || null);

          // Unlock settings
          if (currentCard.unlock_date) {
            setUnlockType('date');
            setUnlockDate(currentCard.unlock_date);
          } else if (currentCard.unlock_days !== null && currentCard.unlock_days !== undefined) {
            setUnlockType('days');
            setUnlockDays(currentCard.unlock_days.toString());
          } else {
            setUnlockType('immediate');
          }

          // Parse instructors JSON
          let instructorsObj = {};
          if (currentCard.instructors_data) {
            try {
              instructorsObj = JSON.parse(currentCard.instructors_data);
            } catch (e) {
              instructorsObj = {};
            }
          }
          
          // Convert dict to list
          const list = Object.keys(instructorsObj).map(key => ({
            key: key,
            name: instructorsObj[key].name || '',
            videos: instructorsObj[key].videos || []
          }));
          
          // If empty list, initialize with default instructors to make it easy for the admin
          if (list.length === 0) {
            setInstructorsList([
              { key: 'elzero', name: 'أسامة الزيرو', videos: [] },
              { key: 'abu_hadhoud', name: 'أبو هدهود', videos: [] },
              { key: 'el_desouki', name: 'محمد الدسوقي', videos: [] }
            ]);
          } else {
            setInstructorsList(list);
          }

          // Find linked exam if any
          const linkedExam = examsData.find(e => e.course_card_id === currentCard.id);
          setLinkedExamId(linkedExam ? linkedExam.id.toString() : '');
        } else {
          // Default initialization for new cards
          setCardTitle('');
          setCardDesc('');
          setCardPhase('basics');
          setCardOrder(1);
          setUnlockType('immediate');
          setInstructorsList([
            { key: 'elzero', name: 'أسامة الزيرو', videos: [] },
            { key: 'abu_hadhoud', name: 'أبو هدهود', videos: [] },
            { key: 'el_desouki', name: 'محمد الدسوقي', videos: [] }
          ]);
        }

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

  // Add a new dynamic instructor
  const handleAddInstructor = () => {
    const key = `inst_${Date.now()}`;
    setInstructorsList(prev => [
      ...prev,
      { key, name: 'محاضر جديد', videos: [] }
    ]);
  };

  // Remove an instructor
  const handleRemoveInstructor = (key) => {
    setInstructorsList(prev => prev.filter(inst => inst.key !== key));
  };

  const handleUpdateInstructorName = (key, val) => {
    setInstructorsList(prev => prev.map(inst => {
      if (inst.key === key) {
        return { ...inst, name: val };
      }
      return inst;
    }));
  };

  const handleAddVideo = (instructorKey) => {
    setInstructorsList(prev => prev.map(inst => {
      if (inst.key === instructorKey) {
        const videos = inst.videos || [];
        const newIndex = videos.length + 1;
        return {
          ...inst,
          videos: [...videos, { title: `الدرس ${newIndex}`, url: '' }]
        };
      }
      return inst;
    }));
  };

  const handleRemoveVideo = (instructorKey, index) => {
    setInstructorsList(prev => prev.map(inst => {
      if (inst.key === instructorKey) {
        const updatedVideos = (inst.videos || []).filter((_, i) => i !== index);
        const cleanedVideos = updatedVideos.map((vid, idx) => ({
          ...vid,
          title: `الدرس ${idx + 1}`
        }));
        return {
          ...inst,
          videos: cleanedVideos
        };
      }
      return inst;
    }));
  };

  const handleVideoUrlChange = (instructorKey, index, urlVal) => {
    setInstructorsList(prev => prev.map(inst => {
      if (inst.key === instructorKey) {
        const copyVids = [...(inst.videos || [])];
        copyVids[index].url = urlVal;
        return {
          ...inst,
          videos: copyVids
        };
      }
      return inst;
    }));
  };

  const handleSave = async () => {
    if (!cardTitle.trim()) {
      Swal.fire('تنبيه', 'يرجى تحديد عنوان الكارت.', 'warning');
      return;
    }

    setSaving(true);
    try {
      // 1. Prepare unlock variables
      let finalUnlockDate = null;
      let finalUnlockDays = null;

      if (unlockType === 'date') {
        if (!unlockDate) {
          Swal.fire('تنبيه', 'يرجى اختيار تاريخ فتح الكارت.', 'warning');
          setSaving(false);
          return;
        }
        finalUnlockDate = unlockDate;
      } else if (unlockType === 'days') {
        if (!unlockDays) {
          Swal.fire('تنبيه', 'يرجى تحديد عدد الأيام.', 'warning');
          setSaving(false);
          return;
        }
        finalUnlockDays = parseInt(unlockDays) || 0;
      }

      // Convert instructors list back to dictionary
      const instructorsObj = {};
      instructorsList.forEach(inst => {
        instructorsObj[inst.key] = {
          name: inst.name,
          videos: inst.videos || []
        };
      });

      const cardPayload = {
        card_id: isNewCard ? "" : cardId,
        title: cardTitle.trim(),
        description: cardDesc.trim(),
        phase: cardPhase,
        order: parseInt(cardOrder) || 1,
        instructors_data: JSON.stringify(instructorsObj),
        unlock_date: finalUnlockDate,
        unlock_days: finalUnlockDays,
        section_id: cardSectionId
      };

      let savedCard = null;

      if (isNewCard) {
        savedCard = await apiService.createCourseCardAdmin(courseId, cardPayload, token);
      } else {
        savedCard = await apiService.updateCourseCardAdmin(courseId, cardId, cardPayload, token);
      }

      // 2. Update Exam Linkage
      if (linkedExamId) {
        await apiService.linkExamToCourse(parseInt(linkedExamId), parseInt(courseId), savedCard.id, token);
      } else {
        // Unlink exams previously linked to this card
        const currentlyLinkedExams = exams.filter(e => e.course_card_id === savedCard.id);
        for (const ex of currentlyLinkedExams) {
          await apiService.linkExamToCourse(ex.id, 0, 0, token);
        }
      }

      Swal.fire('تم الحفظ!', 'تم حفظ بيانات الكارت بنجاح.', 'success').then(() => {
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

  if (!course) return null;

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
            <h1 style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800' }}>
              {isNewCard ? 'إضافة كارت جديد' : `تعديل كارت: ${cardTitle}`}
            </h1>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '5px' }}>
              كورس: {course.title} ({course.course_code})
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate(`/admin/dashboard?course=${courseId}`)}>
            إلغاء والعودة
          </button>
        </div>

        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>العنوان</label>
            <input type="text" className="form-input" value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} placeholder="مثال: المتغيرات وأنواع البيانات" />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>الوصف</label>
            <textarea className="form-input" style={{ minHeight: '100px', resize: 'vertical' }} value={cardDesc} onChange={(e) => setCardDesc(e.target.value)} placeholder="شرح مبسط للمواضيع المغطاة في هذا الدرس" />
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

          {/* Unlock Settings Section */}
          <div className="form-group" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '20px', borderRadius: '12px' }}>
            <label className="form-label" style={{ color: '#10b981', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
              ⚙️ إعدادات فتح الكارت للطلاب:
            </label>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
              <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="unlock_type" value="immediate" checked={unlockType === 'immediate'} onChange={() => setUnlockType('immediate')} />
                يفتح تلقائياً (بالترتيب)
              </label>
              <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="unlock_type" value="date" checked={unlockType === 'date'} onChange={() => setUnlockType('date')} />
                تاريخ ميلادي محدد
              </label>
              <label style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="unlock_type" value="days" checked={unlockType === 'days'} onChange={() => setUnlockType('days')} />
                بعد عدد أيام من التسجيل
              </label>
            </div>

            {unlockType === 'date' && (
              <div className="form-group">
                <label className="form-label" style={{ color: '#fff', fontSize: '0.9rem' }}>اختر تاريخ فتح الدرس:</label>
                <input type="date" className="form-input" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }} />
              </div>
            )}

            {unlockType === 'days' && (
              <div className="form-group">
                <label className="form-label" style={{ color: '#fff', fontSize: '0.9rem' }}>عدد الأيام بعد التسجيل (مثلاً: 3 تعني في اليوم الثالث للطلاب):</label>
                <input type="number" min="0" className="form-input" value={unlockDays} onChange={(e) => setUnlockDays(e.target.value)} placeholder="مثال: 5" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }} />
              </div>
            )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: 'white', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', borderRight: '4px solid #06b6d4', paddingRight: '10px' }}>
                <FaVideo style={{ color: '#06b6d4' }} /> المحاضرون الفيديوهات في هذا الكارت:
              </h3>
              <button type="button" className="btn btn-accent" style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={handleAddInstructor}>
                <FaPlus /> إضافة محاضر جديد
              </button>
            </div>
            
            {instructorsList.map(inst => (
              <div key={inst.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#06b6d4', fontWeight: 'bold', fontSize: '1.1rem', padding: '5px 10px', width: 'auto', borderRadius: '6px' }}
                    value={inst.name}
                    onChange={(e) => handleUpdateInstructorName(inst.key, e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => handleAddVideo(inst.key)}>
                      + إضافة درس/فيديو
                    </button>
                    <button type="button" className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => handleRemoveInstructor(inst.key)}>
                      <FaTrash /> حذف المحاضر
                    </button>
                  </div>
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
                          onChange={(e) => handleVideoUrlChange(inst.key, vidIdx, e.target.value)}
                        />
                        <button type="button" className="btn btn-danger" style={{ padding: '10px 15px' }} onClick={() => handleRemoveVideo(inst.key, vidIdx)}>
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#4b5563', fontSize: '0.9rem', fontStyle: 'italic' }}>لا توجد فيديوهات مضافة لهذا المحاضر بعد.</p>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <button className="btn btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={handleSave} disabled={saving}>
              <FaSave /> {saving ? 'جاري الحفظ...' : 'حفظ الكارت'}
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
