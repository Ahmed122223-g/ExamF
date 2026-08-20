import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  FaPlus, FaTrash, FaEdit, FaKey, FaCopy, FaSignOutAlt, 
  FaArrowRight, FaMapMarkedAlt, FaGraduationCap, FaFileAlt, 
  FaSearch, FaCheckCircle, FaClock, FaClipboardList, FaLayerGroup 
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminRoadmaps = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  // Create / Edit Roadmap Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [roadmapDesc, setRoadmapDesc] = useState('');
  const [initialCodesCount, setInitialCodesCount] = useState(20);
  const [savingRoadmap, setSavingRoadmap] = useState(false);

  // Codes Manager Modal
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [selectedRoadmapForCodes, setSelectedRoadmapForCodes] = useState(null);
  const [codesData, setCodesData] = useState([]);
  const [codesFilter, setCodesFilter] = useState('all');
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [extraCodesCount, setExtraCodesCount] = useState(20);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [codeSearch, setCodeSearch] = useState('');

  // Structure / Builder Modal
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [selectedRoadmapForStructure, setSelectedRoadmapForStructure] = useState(null);
  const [structureData, setStructureData] = useState(null);
  const [loadingStructure, setLoadingStructure] = useState(false);

  // Stage Modal
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const [stageTitle, setStageTitle] = useState('');
  const [stageDesc, setStageDesc] = useState('');
  const [stageOrder, setStageOrder] = useState(1);
  const [savingStage, setSavingStage] = useState(false);

  // Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemType, setItemType] = useState('article');
  const [articleContent, setArticleContent] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [itemOrder, setItemOrder] = useState(1);
  const [savingItem, setSavingItem] = useState(false);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAdminRoadmaps(token);
      setRoadmaps(data || []);

      const coursesList = await apiService.getAdminCourses(token).catch(() => []);
      setCourses(coursesList || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      } else {
        Swal.fire('خطأ', 'فشل في تحميل المسارات التعليمية.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  // --- Create / Edit Roadmap ---
  const openCreateModal = () => {
    setEditingRoadmap(null);
    setRoadmapTitle('');
    setRoadmapDesc('');
    setInitialCodesCount(20);
    setShowCreateModal(true);
  };

  const openEditModal = (rm) => {
    setEditingRoadmap(rm);
    setRoadmapTitle(rm.title);
    setRoadmapDesc(rm.description || '');
    setShowCreateModal(true);
  };

  const handleSaveRoadmap = async (e) => {
    e.preventDefault();
    if (!roadmapTitle.trim()) return;

    setSavingRoadmap(true);
    try {
      if (editingRoadmap) {
        await apiService.updateAdminRoadmap(editingRoadmap.id, {
          title: roadmapTitle.trim(),
          description: roadmapDesc.trim(),
          is_active: editingRoadmap.is_active
        }, token);
        Swal.fire('تم التعديل!', 'تم تحديث بيانات المسار بنجاح.', 'success');
      } else {
        await apiService.createAdminRoadmap({
          title: roadmapTitle.trim(),
          description: roadmapDesc.trim(),
          initial_codes_count: parseInt(initialCodesCount) || 20
        }, token);
        Swal.fire('تم الإنشاء!', `تم إنشاء المسار وتوليد ${initialCodesCount} كود وصول بنجاح.`, 'success');
      }
      setShowCreateModal(false);
      fetchRoadmaps();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.detail || 'فشل في حفظ المسار.', 'error');
    } finally {
      setSavingRoadmap(false);
    }
  };

  const handleDeleteRoadmap = async (rmId) => {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف المسار وكافة مراحله وأكواد الوصول واشتراكات الطلاب المسجلة به!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف المسار',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiService.deleteAdminRoadmap(rmId, token);
          Swal.fire('تم الحذف!', 'تم حذف المسار بنجاح.', 'success');
          fetchRoadmaps();
        } catch (err) {
          Swal.fire('خطأ', 'فشل في حذف المسار.', 'error');
        }
      }
    });
  };

  // --- Codes Management ---
  const openCodesModal = async (rm) => {
    setSelectedRoadmapForCodes(rm);
    setShowCodesModal(true);
    fetchCodes(rm.id, codesFilter);
  };

  const fetchCodes = async (roadmapId, filter) => {
    setLoadingCodes(true);
    try {
      const data = await apiService.getRoadmapCodes(roadmapId, filter, token);
      setCodesData(data.codes || []);
    } catch (err) {
      Swal.fire('خطأ', 'فشل في جلب أكواد المسار.', 'error');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleGenerateExtraCodes = async () => {
    if (!selectedRoadmapForCodes) return;
    setGeneratingCodes(true);
    try {
      await apiService.generateRoadmapCodes(selectedRoadmapForCodes.id, parseInt(extraCodesCount) || 20, token);
      Swal.fire('تم التوليد!', `تم توليد ${extraCodesCount} كود إضافي بنجاح.`, 'success');
      fetchCodes(selectedRoadmapForCodes.id, codesFilter);
      fetchRoadmaps();
    } catch (err) {
      Swal.fire('خطأ', 'فشل في توليد الأكواد الإضافية.', 'error');
    } finally {
      setGeneratingCodes(false);
    }
  };

  const copyToClipboard = (text, message = 'تم نسخ الكود للحافظة!') => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: 'success',
      title: message,
      timer: 1200,
      showConfirmButton: false
    });
  };

  const copyAllUnusedCodes = () => {
    const unused = codesData.filter(c => !c.is_used).map(c => c.code);
    if (unused.length === 0) {
      Swal.fire('تنبيه', 'لا توجد أكواد متاحة غير مستخدمة للنسخ.', 'info');
      return;
    }
    const allText = unused.join('\n');
    copyToClipboard(allText, `تم نسخ ${unused.length} كود متاح بنجاح!`);
  };

  // --- Structure & Stages Builder ---
  const openStructureModal = async (rm) => {
    setSelectedRoadmapForStructure(rm);
    setShowStructureModal(true);
    fetchStructure(rm.id);
  };

  const fetchStructure = async (roadmapId) => {
    setLoadingStructure(true);
    try {
      const data = await apiService.getRoadmapStructureAdmin(roadmapId, token);
      setStructureData(data);
    } catch (err) {
      Swal.fire('خطأ', 'فشل في جلب مراحل المسار.', 'error');
    } finally {
      setLoadingStructure(false);
    }
  };

  const openAddStage = () => {
    setEditingStage(null);
    setStageTitle('');
    setStageDesc('');
    setStageOrder((structureData?.stages?.length || 0) + 1);
    setShowStageModal(true);
  };

  const openEditStage = (stage) => {
    setEditingStage(stage);
    setStageTitle(stage.title);
    setStageDesc(stage.description || '');
    setStageOrder(stage.order);
    setShowStageModal(true);
  };

  const handleSaveStage = async (e) => {
    e.preventDefault();
    if (!stageTitle.trim()) return;

    setSavingStage(true);
    try {
      if (editingStage) {
        await apiService.updateRoadmapStageAdmin(editingStage.id, {
          title: stageTitle.trim(),
          description: stageDesc.trim(),
          order: parseInt(stageOrder) || 1
        }, token);
      } else {
        await apiService.createRoadmapStageAdmin(selectedRoadmapForStructure.id, {
          title: stageTitle.trim(),
          description: stageDesc.trim(),
          order: parseInt(stageOrder) || 1
        }, token);
      }
      setShowStageModal(false);
      fetchStructure(selectedRoadmapForStructure.id);
      fetchRoadmaps();
    } catch (err) {
      Swal.fire('خطأ', 'فشل في حفظ المرحلة.', 'error');
    } finally {
      setSavingStage(false);
    }
  };

  const handleDeleteStage = async (stageId) => {
    Swal.fire({
      title: 'حذف المرحلة؟',
      text: 'سيتم حذف المرحلة وجميع الكروت والمقالات التابعة لها!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، حذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await apiService.deleteRoadmapStageAdmin(stageId, token);
          fetchStructure(selectedRoadmapForStructure.id);
          fetchRoadmaps();
        } catch (err) {
          Swal.fire('خطأ', 'فشل في حذف المرحلة.', 'error');
        }
      }
    });
  };

  const openAddItem = (stageId) => {
    setCurrentStageId(stageId);
    setEditingItem(null);
    setItemTitle('');
    setItemDesc('');
    setItemType('article');
    setArticleContent('');
    setSelectedCourseId(courses[0]?.id?.toString() || '');
    setItemOrder(1);
    setShowItemModal(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setCurrentStageId(item.stage_id);
    setItemTitle(item.title);
    setItemDesc(item.description || '');
    setItemType(item.item_type || 'article');
    setArticleContent(item.article_content || '');
    setSelectedCourseId(item.course_id ? item.course_id.toString() : '');
    setItemOrder(item.order);
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    setSavingItem(true);
    try {
      const payload = {
        title: itemTitle.trim(),
        description: itemDesc.trim(),
        item_type: itemType,
        article_content: itemType === 'article' ? articleContent : null,
        course_id: itemType === 'course' && selectedCourseId ? parseInt(selectedCourseId) : null,
        order: parseInt(itemOrder) || 1
      };

      if (editingItem) {
        await apiService.updateRoadmapItemAdmin(editingItem.id, payload, token);
      } else {
        await apiService.createRoadmapItemAdmin(currentStageId, payload, token);
      }
      setShowItemModal(false);
      fetchStructure(selectedRoadmapForStructure.id);
      fetchRoadmaps();
    } catch (err) {
      Swal.fire('خطأ', 'فشل في حفظ الكارت.', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    Swal.fire({
      title: 'حذف الكارت؟',
      text: 'هل تود حذف هذا الكارت من المرحلة؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذفه',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444'
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await apiService.deleteRoadmapItemAdmin(itemId, token);
          fetchStructure(selectedRoadmapForStructure.id);
          fetchRoadmaps();
        } catch (err) {
          Swal.fire('خطأ', 'فشل في حذف الكارت.', 'error');
        }
      }
    });
  };

  const filteredCodes = codesData.filter(c => {
    if (!codeSearch) return true;
    const q = codeSearch.toLowerCase();
    return c.code.toLowerCase().includes(q) || (c.student_name && c.student_name.toLowerCase().includes(q)) || (c.student_email && c.student_email.toLowerCase().includes(q));
  });

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <Link to="/admin/dashboard" className="nav-brand">
          منصة الاختبارات <span>إدارة المسارات (Roadmaps) 🗺️</span>
        </Link>
        <div className="nav-links">
          <Link to="/admin/dashboard" className="nav-btn">لوحة التحكم</Link>
          <Link to="/admin/exams" className="nav-btn">الاختبارات</Link>
          <Link to="/admin/results" className="nav-btn">النتائج</Link>
          <Link to="/admin/students" className="nav-btn">الطلاب</Link>
          <Link to="/admin/review" className="nav-btn">المشاريع والأسئلة</Link>
          <button onClick={handleLogout} className="nav-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaSignOutAlt /> خروج
          </button>
        </div>
      </nav>

      <main className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', direction: 'rtl' }}>
        
        {/* Header & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800', margin: 0 }}>
              🗺️ المسارات التعليمية وأكواد الاشتراك
            </h1>
            <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.9rem', marginTop: '6px' }}>
              إنشاء مسارات تعليمية بمراحل ومقالات وكورسات متسلسلة وتوليد أكواد وصول شهرية للطلاب.
            </p>
          </div>

          <button 
            onClick={openCreateModal}
            className="btn btn-accent"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '1rem', fontWeight: 'bold' }}
          >
            <FaPlus /> إنشاء مسار تعليمي جديد (Roadmap)
          </button>
        </div>

        {/* Roadmaps List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner"></div>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FaMapMarkedAlt style={{ fontSize: '3.5rem', color: '#475569', marginBottom: '15px' }} />
            <h3 style={{ color: 'white', fontSize: '1.3rem', marginBottom: '10px' }}>لا توجد مسارات تعليمية بعد</h3>
            <p style={{ color: 'var(--text-muted-dark)', marginBottom: '25px' }}>ابدأ الآن بإنشاء أول مسار تعليمي وتوليد أكواد الاشتراك الخاصة به.</p>
            <button onClick={openCreateModal} className="btn btn-accent">إنشاء مسار جديد</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '22px' }}>
            {roadmaps.map((rm) => (
              <div 
                key={rm.id} 
                className="glass-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                  borderTop: '4px solid #8b5cf6',
                  background: 'rgba(15, 23, 42, 0.7)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '3px 10px', borderRadius: '50px', fontWeight: 'bold' }}>
                      مسار نشط
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      👥 {rm.active_students} طالب نشط
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', color: 'white', fontWeight: 'bold', margin: '6px 0 8px 0' }}>
                    🗺️ {rm.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted-dark)', fontSize: '0.88rem', lineHeight: '1.5', minHeight: '40px' }}>
                    {rm.description || 'بدون وصف.'}
                  </p>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', marginTop: '12px', textAlign: 'center' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>المراحل</div>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{rm.total_stages}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>الكروت</div>
                      <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>{rm.total_items}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>الأكواد المتاحة</div>
                      <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>{rm.unused_codes} / {rm.total_codes}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openStructureModal(rm)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <FaLayerGroup /> إدارة المراحل والمحتوى
                    </button>
                    <button
                      onClick={() => openCodesModal(rm)}
                      className="btn"
                      style={{ flex: 1, padding: '8px', fontSize: '0.85rem', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <FaKey /> إدارة وتوليد الأكواد
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(rm)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '6px', fontSize: '0.82rem' }}
                    >
                      <FaEdit /> تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteRoadmap(rm.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      title="حذف المسار"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Roadmap Modal */}
        {showCreateModal && (
          <div className="roadmap-modal-overlay">
            <div className="roadmap-modal-content" style={{ background: '#0f172a', maxWidth: '520px' }}>
              <button className="roadmap-modal-close" onClick={() => setShowCreateModal(false)}>×</button>

              <h2 style={{ color: 'white', fontWeight: 'bold', marginBottom: '18px' }}>
                {editingRoadmap ? 'تعديل بيانات المسار' : 'إنشاء مسار تعليمي جديد (Roadmap)'}
              </h2>

              <form onSubmit={handleSaveRoadmap} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">اسم المسار التعليمي</label>
                  <input
                    type="text"
                    className="form-input"
                    value={roadmapTitle}
                    onChange={(e) => setRoadmapTitle(e.target.value)}
                    placeholder="مثال: مسار احتراف C++ ومفاهيم هياكل البيانات"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">وصف المسار</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={roadmapDesc}
                    onChange={(e) => setRoadmapDesc(e.target.value)}
                    placeholder="شرح وتوضيح لما سيتم تغطيته في هذا المسار..."
                  />
                </div>

                {!editingRoadmap && (
                  <div className="form-group">
                    <label className="form-label">عدد أكواد الاشتراك المطلوب توليدها أولياً (10 خانات)</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      className="form-input"
                      value={initialCodesCount}
                      onChange={(e) => setInitialCodesCount(e.target.value)}
                      required
                    />
                    <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                      سيتم توليد أكواد عشوائية فريدة تلقائياً صالحة لمدة شهر لكل كود عند استخدامه.
                    </small>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-accent" style={{ flex: 1 }} disabled={savingRoadmap}>
                    {savingRoadmap ? 'جاري الحفظ...' : (editingRoadmap ? 'حفظ التعديلات' : 'إنشاء وتوليد الأكواد 🚀')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Codes Manager Modal */}
        {showCodesModal && selectedRoadmapForCodes && (
          <div className="roadmap-modal-overlay">
            <div className="roadmap-modal-content" style={{ background: '#0f172a', maxWidth: '800px', maxHeight: '88vh', overflowY: 'auto' }}>
              <button className="roadmap-modal-close" onClick={() => setShowCodesModal(false)}>×</button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>
                    🔑 أكواد الاشتراك: {selectedRoadmapForCodes.title}
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                    صلاحية كل كود 30 يوماً من تاريخ استخدامه بواسطة الطالب.
                  </p>
                </div>

                <button 
                  onClick={copyAllUnusedCodes}
                  className="btn"
                  style={{ background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}
                >
                  <FaCopy /> نسخ الأكواد المتاحة دفعة واحدة
                </button>
              </div>

              {/* Generate Extra Codes Box */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.92rem', marginBottom: '10px' }}>
                  ⚡ توليد دفعة أكواد إضافية:
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    className="form-input"
                    style={{ maxWidth: '140px' }}
                    value={extraCodesCount}
                    onChange={(e) => setExtraCodesCount(e.target.value)}
                    placeholder="العدد"
                  />
                  <button 
                    onClick={handleGenerateExtraCodes}
                    disabled={generatingCodes}
                    className="btn btn-accent"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {generatingCodes ? 'جاري التوليد...' : `+ توليد ${extraCodesCount} كود الآن`}
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ابحث بالكود أو اسم الطالب..."
                    value={codeSearch}
                    onChange={(e) => setCodeSearch(e.target.value)}
                    style={{ paddingRight: '35px' }}
                  />
                  <FaSearch style={{ position: 'absolute', top: '15px', right: '12px', color: '#64748b' }} />
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    onClick={() => { setCodesFilter('all'); fetchCodes(selectedRoadmapForCodes.id, 'all'); }}
                    className={`btn ${codesFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    الكل ({codesData.length})
                  </button>
                  <button 
                    onClick={() => { setCodesFilter('unused'); fetchCodes(selectedRoadmapForCodes.id, 'unused'); }}
                    className={`btn ${codesFilter === 'unused' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#34d399' }}
                  >
                    المتاحة فقط
                  </button>
                  <button 
                    onClick={() => { setCodesFilter('used'); fetchCodes(selectedRoadmapForCodes.id, 'used'); }}
                    className={`btn ${codesFilter === 'used' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#f87171' }}
                  >
                    المستخدمة
                  </button>
                </div>
              </div>

              {/* Codes Table */}
              {loadingCodes ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
              ) : filteredCodes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>لا توجد أكواد مطابقة.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'right' }}>
                        <th style={{ padding: '10px' }}>الكود (10 خانات)</th>
                        <th style={{ padding: '10px' }}>الحالة</th>
                        <th style={{ padding: '10px' }}>الطالب</th>
                        <th style={{ padding: '10px' }}>تاريخ الاستخدام</th>
                        <th style={{ padding: '10px' }}>الصلاحية المتبقية</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>نسخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCodes.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold', color: '#c084fc', fontSize: '1rem', letterSpacing: '1px' }}>
                            {c.code}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {c.is_used ? (
                              <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                مستخدم
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                متاح
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px', color: '#e2e8f0' }}>
                            {c.student_name ? `${c.student_name} (${c.student_email || ''})` : '-'}
                          </td>
                          <td style={{ padding: '10px', color: '#94a3b8' }}>
                            {c.used_at ? new Date(c.used_at).toLocaleDateString('ar-EG') : '-'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {c.is_used ? (
                              c.is_expired ? (
                                <span style={{ color: '#ef4444' }}>منتهي</span>
                              ) : (
                                <span style={{ color: '#38bdf8' }}>متبقي {c.remaining_days} يوم</span>
                              )
                            ) : '-'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button
                              onClick={() => copyToClipboard(c.code)}
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', color: 'white' }}
                              title="نسخ الكود"
                            >
                              <FaCopy />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Structure & Stages Builder Modal */}
        {showStructureModal && selectedRoadmapForStructure && (
          <div className="roadmap-modal-overlay">
            <div className="roadmap-modal-content" style={{ background: '#0f172a', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
              <button className="roadmap-modal-close" onClick={() => setShowStructureModal(false)}>×</button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>
                    🏗️ مراحل ومحتوى: {selectedRoadmapForStructure.title}
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>
                    تقسيم المسار إلى مراحل تعليمية وإضافة مقالات أو كورسات متسلسلة بداخل كل مرحلة.
                  </p>
                </div>

                <button 
                  onClick={openAddStage}
                  className="btn btn-accent"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                >
                  <FaPlus /> إضافة مرحلة جديدة
                </button>
              </div>

              {loadingStructure ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>
              ) : structureData?.stages?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  لا توجد مراحل مضافة بعد. اضغط على زر "إضافة مرحلة جديدة" للبدء في بناء المسار.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {structureData?.stages?.map((stage, sIdx) => (
                    <div key={stage.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                            المرحلة #{stage.order || sIdx + 1}
                          </span>
                          <h3 style={{ color: 'white', fontSize: '1.15rem', fontWeight: 'bold', margin: '4px 0' }}>
                            {stage.title}
                          </h3>
                          {stage.description && <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{stage.description}</p>}
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => openAddItem(stage.id)}
                            className="btn"
                            style={{ background: '#10b981', color: 'white', fontSize: '0.78rem', padding: '4px 10px' }}
                          >
                            + إضافة كارت
                          </button>
                          <button
                            onClick={() => openEditStage(stage)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteStage(stage.id)}
                            className="btn btn-danger"
                            style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      {/* Items in Stage */}
                      {stage.items.length === 0 ? (
                        <div style={{ color: '#64748b', fontSize: '0.82rem', fontStyle: 'italic', padding: '8px 0' }}>
                          لا توجد كروت مضافة في هذه المرحلة بعد.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', marginTop: '10px' }}>
                          {stage.items.map((item) => (
                            <div key={item.id} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.75rem', color: item.item_type === 'article' ? '#38bdf8' : '#34d399', fontWeight: 'bold' }}>
                                  {item.item_type === 'article' ? '📄 مقال' : `🎓 كورس (${item.course_title || 'مرتبط'})`}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button onClick={() => openEditItem(item)} className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>تعديل</button>
                                  <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger" style={{ padding: '2px 6px', fontSize: '0.7rem' }}><FaTrash /></button>
                                </div>
                              </div>
                              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem' }}>{item.title}</div>
                              {item.description && <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stage Create/Edit Modal */}
        {showStageModal && (
          <div className="roadmap-modal-overlay" style={{ zIndex: 1200 }}>
            <div className="roadmap-modal-content" style={{ background: '#0f172a', maxWidth: '480px' }}>
              <button className="roadmap-modal-close" onClick={() => setShowStageModal(false)}>×</button>
              <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '15px' }}>
                {editingStage ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
              </h3>
              <form onSubmit={handleSaveStage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">اسم المرحلة</label>
                  <input
                    type="text"
                    className="form-input"
                    value={stageTitle}
                    onChange={(e) => setStageTitle(e.target.value)}
                    placeholder="مثال: المرحلة الأولى: أساسيات البرمجة"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">وصف المرحلة (اختياري)</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={stageDesc}
                    onChange={(e) => setStageDesc(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ترتيب المرحلة</label>
                  <input
                    type="number"
                    className="form-input"
                    value={stageOrder}
                    onChange={(e) => setStageOrder(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="btn btn-accent" style={{ flex: 1 }} disabled={savingStage}>
                    {savingStage ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStageModal(false)}>إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Item Create/Edit Modal */}
        {showItemModal && (
          <div className="roadmap-modal-overlay" style={{ zIndex: 1200 }}>
            <div className="roadmap-modal-content" style={{ background: '#0f172a', maxWidth: '580px', maxHeight: '85vh', overflowY: 'auto' }}>
              <button className="roadmap-modal-close" onClick={() => setShowItemModal(false)}>×</button>
              <h3 style={{ color: 'white', fontWeight: 'bold', marginBottom: '15px' }}>
                {editingItem ? 'تعديل الكارت' : 'إضافة كارت جديد للمرحلة'}
              </h3>
              <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">عنوان الكارت</label>
                  <input
                    type="text"
                    className="form-input"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="مثال: مقدمة في بنية المتغيرات"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">وصف مختصر</label>
                  <input
                    type="text"
                    className="form-input"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع الكارت</label>
                  <select
                    className="form-input"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                  >
                    <option value="article">📄 مقال تعليمي (قراءة واكتمال)</option>
                    <option value="course">🎓 كورس تعليمي كامل (محاضرات + تمارين + أسئلة)</option>
                  </select>
                </div>

                {itemType === 'article' ? (
                  <div className="form-group">
                    <label className="form-label">محتوى المقال (نص وشرح كامل)</label>
                    <textarea
                      className="form-input"
                      rows="7"
                      value={articleContent}
                      onChange={(e) => setArticleContent(e.target.value)}
                      placeholder="اكتب محتوى المقال والتعليمات هنا..."
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">اختر الكورس المرتبط بهذا الكارت من المنصة</label>
                    {courses.length === 0 ? (
                      <p style={{ color: '#f87171', fontSize: '0.85rem' }}>لا توجد كورسات في المنصة بعد. يرجى إنشاء كورس أولاً.</p>
                    ) : (
                      <select
                        className="form-input"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        required
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.course_code})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">ترتيب الكارت داخل المرحلة</label>
                  <input
                    type="number"
                    className="form-input"
                    value={itemOrder}
                    onChange={(e) => setItemOrder(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" className="btn btn-accent" style={{ flex: 1 }} disabled={savingItem}>
                    {savingItem ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminRoadmaps;
