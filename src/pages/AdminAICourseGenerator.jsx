import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  FaArrowRight, FaMagic, FaBook, FaLayerGroup,
  FaProjectDiagram, FaYoutube, FaGraduationCap,
  FaLightbulb
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const AdminAICourseGenerator = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  const [topicDescription, setTopicDescription] = useState('');
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [sectionsCount, setSectionsCount] = useState(3);
  const [cardsPerSection, setCardsPerSection] = useState(4);
  const [hasProject, setHasProject] = useState(true);
  const [projectScope, setProjectScope] = useState('final');
  const [questionsPerCard, setQuestionsPerCard] = useState(3);
  const [preferredChannels, setPreferredChannels] = useState('');
  const [targetLevel, setTargetLevel] = useState('beginner_to_advanced');

  const [generating, setGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    '🧠 جاري تحليل الأهداف التعليمية وموضوع الدورة...',
    '📐 جاري هيكلة المنهج وتقسيم الأقسام والدروس بالتساوي...',
    '🎥 جاري البحث عن أفضل المحاضرات والفيديوهات وقنوات اليوتيوب...',
    '📝 جاري صياغة الأسئلة التفاعلية متدرجة الصعوبة وكتابة المصطلحات...',
    '💾 جاري حفظ وبناء الكورس بالكامل في قاعدة البيانات...'
  ];

  useEffect(() => {
    let interval;
    if (generating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const presetTopics = [
    {
      label: '🐍 بايثون من الصفر للاحتراف (Python)',
      desc: 'كورس شامل في لغة بايثون يبدأ من الأساسيات والمتغيرات والشروط وحلقات التكرار ثم الدوال والبرمجة كائنية التوجه (OOP) والتعامل مع الملفات والمكتبات وصولاً لبناء مشاريع تطبيقية.'
    },
    {
      label: '⚛️ تطوير واجهات الويب بـ React',
      desc: 'دورة تفاعلية لتطوير واجهات المستخدم بمكتبة React الحديثة تغطي الـ Components, JSX, Hooks (useState, useEffect), State Management, Routing, واستهلاك الـ APIs وبناء مشاريع عملية متكاملة.'
    },
    {
      label: '💻 أساسيات علوم الحاسب وهياكل البيانات (C++)',
      desc: 'مسار أكاديمي وتطبيقي يغطي أساسيات البرمجة بلغة C++، إدارة الذاكرة، المؤشرات (Pointers)، وهياكل البيانات الأساسية (Arrays, Linked Lists, Stacks, Queues, Trees) مع حل مسائل برمجية متدرجة.'
    },
    {
      label: '🌐 مسار تطوير الويب الكامل (Full-Stack JS)',
      desc: 'خارطة طريق كاملة لتطوير تطبيقات الويب تشمل HTML5, CSS3, JavaScript الحديث (ES6+), Node.js, Express, وقواعد بيانات MongoDB مع بناء مشاريع Full-Stack واقعية.'
    }
  ];

  const handleApplyPreset = (preset) => {
    setTopicDescription(preset.desc);
    setTitle(preset.label.replace(/^[^\s]+\s/, ''));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!topicDescription.trim()) {
      Swal.fire('تنبيه', 'يرجى كتابة وصف ومحتوى الكورس المراد توليده بالتفصيل.', 'warning');
      return;
    }

    setGenerating(true);
    setLoadingStep(0);

    try {
      const payload = {
        topic_description: topicDescription.trim(),
        title: title.trim() || undefined,
        course_code: courseCode.trim() || undefined,
        sections_count: parseInt(sectionsCount) || 3,
        cards_per_section: parseInt(cardsPerSection) || 4,
        has_project: hasProject,
        project_scope: hasProject ? projectScope : 'none',
        questions_per_card: parseInt(questionsPerCard) || 3,
        preferred_channels: preferredChannels.trim() || undefined,
        target_level: targetLevel
      };

      const result = await apiService.generateCourseAI(payload, token);

      Swal.fire({
        icon: 'success',
        title: 'تم توليد الكورس بنجاح! 🎉',
        html: `
          <div style="text-align: right; direction: rtl; font-size: 0.95rem; line-height: 1.8; color: #cbd5e1;">
            <p><strong>اسم الكورس:</strong> ${result.title}</p>
            <p><strong>كود الكورس:</strong> <code style="color: #38bdf8; font-weight: bold;">${result.course_code}</code></p>
            <hr style="border-color: rgba(255,255,255,0.1); margin: 10px 0;" />
            <p>📁 <strong>الأقسام:</strong> ${result.sections_count} أقسام</p>
            <p>📚 <strong>الدروس والكروت:</strong> ${result.cards_count} كارت تفاعلي</p>
            <p>❓ <strong>الأسئلة المنشأة:</strong> ${result.questions_count} سؤال متدرج</p>
          </div>
        `,
        confirmButtonText: 'الانتقال لإدارة ومراجعة الكورس 🚀',
        showCancelButton: true,
        cancelButtonText: 'العودة للكورسات',
        confirmButtonColor: '#7c3aed',
        cancelButtonColor: '#334155'
      }).then((swalResult) => {
        if (swalResult.isConfirmed) {
          navigate(`/admin/dashboard?course=${result.course_id}`);
        } else {
          navigate('/admin/dashboard');
        }
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'تعذر التوليد',
        text: err.response?.data?.detail || 'حدث خطأ أثناء توليد الكورس بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="app-container" style={{ direction: 'rtl', minHeight: '100vh', background: '#090d16', color: '#f1f5f9' }}>
      {/* NAVBAR */}
      <nav className="navbar" style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link to="/admin/dashboard" className="nav-brand">
          منصة الاختبارات الإلكترونية <span>لوحة التحكم</span>
        </Link>
        <div className="nav-links">
          <button onClick={() => navigate('/admin/dashboard')} className="nav-btn">
            <FaArrowRight /> العودة للوحة التحكم
          </button>
        </div>
      </nav>

      <main className="main-content" style={{ maxWidth: '1050px', margin: '0 auto', padding: '30px 20px' }}>
        {/* HEADER BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.22) 0%, rgba(6, 182, 212, 0.15) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '24px',
          padding: '30px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(124, 58, 237, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)'
            }}>
              <FaMagic />
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: '800', color: '#fff', margin: 0 }}>
                توليد دورة تدريبية ذكية بالذكاء الاصطناعي (AI Course Generator)
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.92rem', marginTop: '6px', lineHeight: '1.6' }}>
                اكتب ما ترغب في تعليمه وحدد عدد الأقسام والدروس والأسئلة والمشاريع، وسيقوم الذكاء الاصطناعي ببناء وهيكلة الكورس كاملاً مع فيديوهات يوتيوب وأسئلة متدرجة.
              </p>
            </div>
          </div>
        </div>

        {/* PRESET SHORTCUTS */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#c084fc', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <FaLightbulb /> نماذج مقترحة جاهزة للاختيار السريع:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {presetTopics.map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: '#e2e8f0',
                  textAlign: 'right',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* GENERATOR FORM */}
        <form onSubmit={handleGenerate}>
          {/* SECTION 1: TOPIC & BASICS */}
          <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '26px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '800', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaBook style={{ color: '#06b6d4' }} /> محتوى وموضوع الكورس
            </h2>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '0.95rem' }}>
                وصف الكورس والمهارات المستهدفة بالتفصيل <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                className="form-input"
                required
                style={{ minHeight: '130px', resize: 'vertical', fontSize: '0.95rem', lineHeight: '1.6' }}
                placeholder="اكتب بالتفصيل: ما هو موضوع الكورس؟ ما هي التقنيات والمفاهيم التي تريد تغطيتها؟ لمن هذا الكورس وما هي النتائج المتوقعة بعد إتمامه؟"
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                  عنوان الكورس (اختياري - سيقترحه الـ AI إذا تركته فارغاً)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: لغة C++ الحديثة من الصفر للاحتراف"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                  كود الكورس البرمجي (اختياري - مثل: CPP-PRO)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: CPP2026"
                  style={{ textTransform: 'uppercase' }}
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: STRUCTURE & COUNTS */}
          <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '26px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '800', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaLayerGroup style={{ color: '#a855f7' }} /> هيكل وأقسام الكورس
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>عدد الأقسام الرئيسية (Sections):</span>
                  <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{sectionsCount} أقسام</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={sectionsCount}
                  onChange={(e) => setSectionsCount(e.target.value)}
                  style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer', marginTop: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>1 قسم</span>
                  <span>4 أقسام</span>
                  <span>8 أقسام</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>عدد الكروت/الدروس في كل قسم:</span>
                  <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{cardsPerSection} كروت/قسم</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={cardsPerSection}
                  onChange={(e) => setCardsPerSection(e.target.value)}
                  style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer', marginTop: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>1 كارت</span>
                  <span>5 كروت</span>
                  <span>10 كروت</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>عدد الأسئلة التفاعلية لكل كارت:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{questionsPerCard} أسئلة/كارت</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={questionsPerCard}
                  onChange={(e) => setQuestionsPerCard(e.target.value)}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer', marginTop: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>بدون أسئلة</span>
                  <span>3 أسئلة</span>
                  <span>6 أسئلة</span>
                </div>
              </div>
            </div>

            {/* SUMMARY STATS PILL */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '0.88rem',
              color: '#cbd5e1'
            }}>
              <span>📊 <strong>إجمالي الأقسام:</strong> {sectionsCount}</span>
              <span>📚 <strong>إجمالي الدروس:</strong> {sectionsCount * cardsPerSection} درس</span>
              <span>❓ <strong>إجمالي الأسئلة التفاعلية:</strong> {sectionsCount * cardsPerSection * questionsPerCard} سؤال</span>
            </div>
          </div>

          {/* SECTION 3: PROJECTS & ADVANCED SETTINGS */}
          <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '26px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '800', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaProjectDiagram style={{ color: '#f59e0b' }} /> إعدادات المشاريع العملية وقنوات اليوتيوب
            </h2>

            {/* PROJECTS TOGGLE */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#fff', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={hasProject}
                  onChange={(e) => setHasProject(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#f59e0b', cursor: 'pointer' }}
                />
                <span>تضمين مشاريع تطبيقية عملية في الكورس (Practical Projects)</span>
              </label>

              {hasProject && (
                <div style={{ marginTop: '14px', marginRight: '32px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
                    <input
                      type="radio"
                      name="projectScope"
                      value="final"
                      checked={projectScope === 'final'}
                      onChange={(e) => setProjectScope(e.target.value)}
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <span>مشروع نهائي شامل في نهاية الكورس فقط (Capstone Project) 🏆</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
                    <input
                      type="radio"
                      name="projectScope"
                      value="section"
                      checked={projectScope === 'section'}
                      onChange={(e) => setProjectScope(e.target.value)}
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <span>مشروع عملي في نهاية كل قسم (Section Projects) 🛠️</span>
                  </label>
                </div>
              )}
            </div>

            {/* CHANNELS & DIFFICULTY */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                  <FaYoutube style={{ color: '#ef4444', marginLeft: '6px' }} />
                  قنوات يوتيوب أو محاضرون مفضلون (اختياري):
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: أسامة الزيرو، محمد الدسوقي، حسوب، أبو هدهود"
                  value={preferredChannels}
                  onChange={(e) => setPreferredChannels(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                  <FaGraduationCap style={{ color: '#38bdf8', marginLeft: '6px' }} />
                  المستوى التعليمي المستهدف:
                </label>
                <select
                  className="form-input"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                >
                  <option value="beginner_to_advanced">من الصفر إلى الاحتراف والتطبيق (شامل)</option>
                  <option value="beginner">مبتدئ تماماً (Beginner)</option>
                  <option value="intermediate">متوسط وتطبيقي (Intermediate)</option>
                  <option value="advanced">متقدم وخبير (Advanced)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON & PROGRESS */}
          {generating ? (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '20px',
              padding: '30px',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid rgba(139, 92, 246, 0.2)',
                  borderTopColor: '#a855f7',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800', margin: '0 0 10px' }}>
                جاري توليد الكورس بالذكاء الاصطناعي... 🚀
              </h3>
              <p style={{ color: '#38bdf8', fontSize: '0.95rem', fontWeight: '600' }}>
                {loadingSteps[loadingStep]}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '12px' }}>
                قد يستغرق ذلك بضع ثوانٍ لإجراء البحوث وصياغة الأسئلة وترتيب الفيديوهات بدقة.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn"
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '16px 24px',
                  borderRadius: '14px',
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 25px rgba(124, 58, 237, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <FaMagic /> بدء توليد الكورس وحفظه في المنصة تلقائياً 🚀
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/admin/dashboard')}
                style={{ padding: '16px 28px', borderRadius: '14px', fontSize: '0.95rem' }}
              >
                إلغاء والعودة
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default AdminAICourseGenerator;
