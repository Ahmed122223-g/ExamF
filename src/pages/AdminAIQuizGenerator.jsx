import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  FaArrowRight, FaMagic, FaClipboardList, FaClock,
  FaCalendarAlt, FaStar, FaLightbulb, FaPlus, FaTrash,
  FaCheckCircle, FaEdit, FaSave, FaRedo, FaCopy,
  FaGraduationCap, FaLayerGroup, FaCheck, FaTimes, FaShieldAlt
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const formatForDateTimeInput = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const AdminAIQuizGenerator = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  // Input states
  const [topicDescription, setTopicDescription] = useState('');
  const [questionsCount, setQuestionsCount] = useState(5);
  const [difficultyLevel, setDifficultyLevel] = useState('progressive'); // progressive, easy, medium, hard
  const [customTitle, setCustomTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [marksMode, setMarksMode] = useState('progressive'); // progressive (1,2,3), fixed_1, fixed_2, fixed_5
  
  // Timing states
  const now = new Date();
  const [startTime, setStartTime] = useState(formatForDateTimeInput(now));
  const [endTime, setEndTime] = useState('');

  // Generated Result / Preview state
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [previewDuration, setPreviewDuration] = useState(15);
  const [previewStartTime, setPreviewStartTime] = useState('');
  const [previewEndTime, setPreviewEndTime] = useState('');
  
  // Loading & Progress states
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    '🧠 جاري تحليل المحتوى التعليمي وموضوع الكويز...',
    '📐 جاري صياغة الأسئلة مع توزيع تدرج الصعوبة (سهل 🟢 -> متوسط 🟡 -> متقدم 🔴)...',
    '🎯 جاري تدقيق الخيارات الأربعة وتعيين الإجابة الصحيحة بدقة...',
    '💡 جاري كتابة الشروحات التعليمية وتوزيع درجات كل سؤال...',
    '✨ جاري إعداد وتجهيز مسودة الكويز للمعاينة والاعتماد...'
  ];

  useEffect(() => {
    let interval;
    if (generating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [generating]);

  // Adjust default duration whenever questions count changes
  useEffect(() => {
    if (!generatedQuiz) {
      setDurationMinutes(Math.max(5, questionsCount * 2));
    }
  }, [questionsCount, generatedQuiz]);

  const presetTopics = [
    {
      label: '🐍 بايثون: المتغيرات والدوال والـ OOP',
      desc: 'اختبار شامل في لغة بايثون يغطي أنواع البيانات، هياكل البيانات (Lists, Dictionaries)، الشروط، الدوال، والبرمجة كائنية التوجه (OOP: Classes, Inheritance, Polymorphism).'
    },
    {
      label: '⚛️ جافاسكربت و React الحديثة',
      desc: 'اختبار في مفاهيم JavaScript ES6+ (Promises, Async/Await, Array Methods) ومكتبة React (Hooks: useState, useEffect, Custom Hooks, Component Lifecycle, Props).'
    },
    {
      label: '🗄️ قواعد البيانات ولغة SQL',
      desc: 'اختبار تقني في تصميم قواعد البيانات العلائقية (Relational Databases)، استعلامات SQL المتقدمة (JOINs, GROUP BY, Subqueries)، الـ Indexes، والمفاتيح الأساسية والأجنبية.'
    },
    {
      label: '🌐 أمن المعلومات وأساسيات الويب (Security)',
      desc: 'كويز في أمن تطبيقات الويب يشمل ثغرات OWASP Top 10 (SQL Injection, XSS, CSRF)، المصادقة بـ JWT و Sessions، والتشفير وحماية البيانات الحساسة.'
    },
    {
      label: '🧩 هياكل البيانات والخوارزميات (DSA)',
      desc: 'كويز تقييمي في هياكل البيانات (Arrays, Linked Lists, Stacks, Queues, Binary Trees) والخوارزميات (Searching, Sorting, Time & Space Complexity Big-O).'
    }
  ];

  const handleSetPreset = (preset) => {
    setTopicDescription(preset.desc);
    setCustomTitle(preset.label.replace(/^[^\s]+\s/, ''));
  };

  const handleQuickDuration = (minutes) => {
    setDurationMinutes(minutes);
  };

  const handleSetQuickEndTime = (hours) => {
    const start = startTime ? new Date(startTime) : new Date();
    if (hours === 0) {
      setEndTime('');
      return;
    }
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    setEndTime(formatForDateTimeInput(end));
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();

    if (!topicDescription.trim()) {
      Swal.fire('تنبيه', 'يرجى كتابة محتوى أو موضوع الكويز الذي ترغب في توليد الأسئلة منه.', 'warning');
      return;
    }

    setGenerating(true);
    setLoadingStep(0);

    let marksVal = null;
    if (marksMode === 'fixed_1') marksVal = 1;
    if (marksMode === 'fixed_2') marksVal = 2;
    if (marksMode === 'fixed_5') marksVal = 5;

    try {
      const payload = {
        topic_description: topicDescription.trim(),
        questions_count: parseInt(questionsCount) || 5,
        difficulty_level: difficultyLevel,
        title: customTitle.trim() || undefined,
        exam_code: customCode.trim().toUpperCase() || undefined,
        duration_minutes: parseInt(durationMinutes) || undefined,
        start_time: startTime ? new Date(startTime).toISOString() : undefined,
        end_time: endTime ? new Date(endTime).toISOString() : undefined,
        marks_per_question: marksVal,
        save_immediately: false
      };

      const response = await apiService.generateAIQuiz(payload, token);

      setGeneratedQuiz(response);
      setPreviewTitle(response.title || customTitle || 'كويز الذكاء الاصطناعي');
      setPreviewCode(response.exam_code || customCode || 'QUIZ-01');
      setPreviewDuration(response.duration_minutes || durationMinutes);
      setPreviewStartTime(startTime || formatForDateTimeInput(new Date()));
      setPreviewEndTime(endTime || '');
      setPreviewQuestions(response.questions || []);

      Swal.fire({
        title: 'تم التوليد بنجاح! 🎉',
        text: `تم توليد ${response.questions?.length || 0} أسئلة متدرجة الصعوبة مع 4 خيارات وإجابة صحيحة محددة. يمكنك الآن مراجعة الكويز وتعديله قبل الحفظ.`,
        icon: 'success',
        confirmButtonColor: '#7c3aed'
      });

      setTimeout(() => {
        const previewElement = document.getElementById('quiz-preview-section');
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);

    } catch (err) {
      console.error(err);
      Swal.fire('خطأ!', err.response?.data?.detail || 'فشل توليد الكويز عبر الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const updateQuestionField = (index, field, value) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCorrectAnswerChange = (qIndex, optionLetter) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], correct_answer: optionLetter.toLowerCase() };
      return updated;
    });
  };

  const handleRemoveQuestion = (index) => {
    if (previewQuestions.length <= 1) {
      Swal.fire('تنبيه', 'يجب أن يحتوي الكويز على سؤال واحد على الأقل.', 'warning');
      return;
    }
    setPreviewQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    const newQ = {
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'a',
      marks: 1,
      difficulty: 'medium',
      explanation: ''
    };
    setPreviewQuestions((prev) => [...prev, newQ]);
  };

  const totalCalculatedMarks = previewQuestions.reduce((sum, q) => sum + (parseInt(q.marks) || 1), 0);

  const handleSaveQuizToDB = async () => {
    if (!previewTitle.trim()) {
      Swal.fire('تنبيه', 'يرجى كتابة عنوان للكويز.', 'warning');
      return;
    }
    if (!previewCode.trim()) {
      Swal.fire('تنبيه', 'يرجى كتابة أو توليد كود للكويز.', 'warning');
      return;
    }
    if (!previewStartTime) {
      Swal.fire('تنبيه', 'يرجى تحديد وقت وتاريخ بدء الكويز.', 'warning');
      return;
    }

    for (let i = 0; i < previewQuestions.length; i++) {
      const q = previewQuestions[i];
      if (!q.question_text.trim()) {
        Swal.fire('خطأ في السؤال', `يرجى كتابة نص السؤال رقم ${i + 1}.`, 'warning');
        return;
      }
      if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        Swal.fire('خيارات ناقصة', `يرجى ملء جميع الخيارات الأربعة (أ، ب، ج، د) للسؤال رقم ${i + 1}.`, 'warning');
        return;
      }
    }

    setSaving(true);
    try {
      const startIso = new Date(previewStartTime).toISOString();
      const endIso = previewEndTime ? new Date(previewEndTime).toISOString() : null;

      const examPayload = {
        title: previewTitle.trim(),
        exam_code: previewCode.trim().toUpperCase(),
        duration_minutes: parseInt(previewDuration) || 15,
        start_time: startIso,
        end_time: endIso,
        questions: previewQuestions.map((q) => ({
          question_text: q.question_text.trim(),
          option_a: q.option_a.trim(),
          option_b: q.option_b.trim(),
          option_c: q.option_c.trim(),
          option_d: q.option_d.trim(),
          correct_answer: (q.correct_answer || 'a').toLowerCase(),
          marks: parseInt(q.marks) || 1,
          explanation: q.explanation ? q.explanation.trim() : null
        }))
      };

      await apiService.createExam(examPayload, token);

      Swal.fire({
        title: 'تم الحفظ والإنشاء بنجاح! 🎉',
        html: `
          <p>تم حفظ الكويز <strong>${previewTitle}</strong> بنجاح في قاعدة البيانات.</p>
          <div style="background: rgba(124, 58, 237, 0.15); padding: 12px; border-radius: 8px; margin: 15px 0; border: 1px dashed #a855f7;">
            <span style="font-size: 0.9rem; color: #cbd5e1;">كود الاختبار للمشاركة مع الطلاب:</span>
            <h2 style="color: #c084fc; font-family: monospace; letter-spacing: 2px; margin: 6px 0;">${previewCode.toUpperCase()}</h2>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'الذهاب إلى قائمة الاختبارات',
        confirmButtonColor: '#7c3aed'
      }).then(() => {
        navigate('/admin/exams');
      });

    } catch (err) {
      console.error(err);
      Swal.fire('خطأ أثناء الحفظ', err.response?.data?.detail || 'فشل في حفظ الكويز في قاعدة البيانات.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    Swal.fire({
      title: 'تم النسخ!',
      text: `كود الكويز ${code} تم نسخه للحافظة.`,
      icon: 'success',
      timer: 1000,
      showConfirmButton: false
    });
  };

  return (
    <div className="app-container" style={{ background: '#090d16', minHeight: '100vh', color: '#f8fafc', paddingBottom: '80px' }}>
      
      {/* Top Navigation Bar */}
      <nav className="navbar" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link to="/admin/dashboard" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900', fontSize: '1.25rem' }}>
            ⚡ منصة الاختبارات
          </span>
          <span style={{ fontSize: '0.85rem', background: 'rgba(124, 58, 237, 0.2)', color: '#c084fc', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
            توليد كويز بالـ AI
          </span>
        </Link>
        <div className="nav-links" style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/admin/exams')} className="nav-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <FaArrowRight /> قائمة الاختبارات
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="nav-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            لوحة التحكم
          </button>
        </div>
      </nav>

      <main className="main-content" style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)', padding: '6px 16px', borderRadius: '30px', color: '#c084fc', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px' }}>
            <FaMagic /> الجيل الجديد من واضعي الاختبارات الذكية
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', marginBottom: '8px' }}>
            إنشاء كويز ذكي متدرج الصعوبة بواسطة <span style={{ background: 'linear-gradient(135deg, #a855f7, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>الذكاء الاصطناعي (AI)</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
            اكتب المحتوى أو الموضوع المطلوب وحدد عدد الأسئلة، وسيقوم الـ AI بصياغة أسئلة دقيقة متدرجة (سهل 🟢، متوسط 🟡، متقدم 🔴) مع 4 خيارات وتعيين الإجابة الصحيحة وشرح تعليمي ودرجات وتوقيتات جاهزة.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', marginBottom: '35px' }}>
          <form onSubmit={handleGenerate}>
            
            {/* Presets Row */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>
                💡 موضوعات مقترحة سريعة (اضغط للتعبئة الفورية):
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {presetTopics.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSetPreset(preset)}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#e2e8f0',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#a855f7';
                      e.currentTarget.style.color = '#c084fc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic & Content Input */}
            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0', fontWeight: 'bold' }}>
                <span>محتوى / موضوع الكويز المطلوب <span style={{ color: '#ef4444' }}>*</span></span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>يمكنك لصق كود أو نص أو منهج أو تفاصيل المحاور</span>
              </label>
              <textarea
                className="form-input"
                style={{
                  minHeight: '130px',
                  background: 'rgba(10, 15, 29, 0.8)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  borderRadius: '10px'
                }}
                placeholder="مثال: كويز في لغة بايثون يغطي الـ List Comprehensions, Decorators, Generators, وتطبيقات الـ OOP وإدارة الاستثناءات Try/Except..."
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                required
              />
            </div>

            {/* Grid for Questions Count & Difficulty & Marks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              
              {/* Questions Count */}
              <div>
                <label className="form-label" style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                  عدد الأسئلة المطلوبة: <span style={{ color: '#a855f7', fontWeight: '900', fontSize: '1.1rem' }}>{questionsCount}</span> أسئلة
                </label>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {[3, 5, 10, 15, 20, 30].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionsCount(cnt)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        background: questionsCount === cnt ? '#7c3aed' : 'rgba(30, 41, 59, 0.6)',
                        color: questionsCount === cnt ? '#fff' : '#94a3b8',
                        border: questionsCount === cnt ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={questionsCount}
                  onChange={(e) => setQuestionsCount(parseInt(e.target.value) || 5)}
                  style={{ width: '100%', accentColor: '#a855f7', cursor: 'pointer' }}
                />
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="form-label" style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                  نظام وتوزيع الصعوبة:
                </label>
                <select
                  className="form-input"
                  style={{ background: 'rgba(10, 15, 29, 0.8)', color: '#fff', borderRadius: '8px' }}
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                >
                  <option value="progressive">✨ تدرج ذكي (سهل 🟢 → متوسط 🟡 → متقدم 🔴)</option>
                  <option value="easy">🟢 للمبتدئين فقط (أسئلة سهلة ومباشرة)</option>
                  <option value="medium">🟡 للمستوى المتوسط (أسئلة تطبيقية متوازنة)</option>
                  <option value="hard">🔴 للمحترفين والمتقدمين (تفكير نقدي وسيناريوهات عميقة)</option>
                </select>
              </div>

              {/* Marks Allocation Mode */}
              <div>
                <label className="form-label" style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                  توزيع درجات الأسئلة:
                </label>
                <select
                  className="form-input"
                  style={{ background: 'rgba(10, 15, 29, 0.8)', color: '#fff', borderRadius: '8px' }}
                  value={marksMode}
                  onChange={(e) => setMarksMode(e.target.value)}
                >
                  <option value="progressive">⭐ درجات متدرجة حسب الصعوبة (سهل=1، متوسط=2، صعب=3)</option>
                  <option value="fixed_1">درجة واحدة لكل سؤال (1 Mark)</option>
                  <option value="fixed_2">درجتان لكل سؤال (2 Marks)</option>
                  <option value="fixed_5">5 درجات لكل سؤال (5 Marks)</option>
                </select>
              </div>
            </div>

            {/* Optional Title and Exam Code */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              <div>
                <label className="form-label" style={{ color: '#e2e8f0' }}>
                  عنوان الكويز <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(اختياري - يتركه فارغاً ليولده الـ AI)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: كويز مهارات بايثون المتقدمة"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  style={{ background: 'rgba(10, 15, 29, 0.8)', color: '#fff' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ color: '#e2e8f0' }}>
                  رمز / كود الكويز <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(اختياري - يتركه فارغاً لكود فريد تلقائي)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: PY-ADV-01"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  style={{ background: 'rgba(10, 15, 29, 0.8)', color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}
                />
              </div>
            </div>

            {/* Timings Section */}
            <div style={{ background: 'rgba(10, 15, 29, 0.5)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#06b6d4', fontWeight: 'bold' }}>
                <FaClock /> إعدادات توقيت ومواعيد الكويز:
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                
                {/* Duration */}
                <div>
                  <label className="form-label" style={{ color: '#cbd5e1' }}>
                    مدة الكويز (بالدقائق):
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 10)}
                    style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fff', marginBottom: '6px' }}
                  />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {[10, 15, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleQuickDuration(m)}
                        style={{
                          flex: 1,
                          fontSize: '0.75rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: 'none',
                          color: '#94a3b8',
                          borderRadius: '4px',
                          padding: '3px 0',
                          cursor: 'pointer'
                        }}
                      >
                        {m}د
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Time */}
                <div>
                  <label className="form-label" style={{ color: '#cbd5e1' }}>
                    تاريخ ووقت البدء:
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fff', marginBottom: '6px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setStartTime(formatForDateTimeInput(new Date()))}
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(6, 182, 212, 0.15)',
                      color: '#06b6d4',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    ⏰ تعيين الوقت الحالي
                  </button>
                </div>

                {/* End Time */}
                <div>
                  <label className="form-label" style={{ color: '#cbd5e1' }}>
                    تاريخ ووقت الانتهاء (اختياري):
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fff', marginBottom: '6px' }}
                  />
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleSetQuickEndTime(24)}
                      style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: 'none', borderRadius: '4px', padding: '3px 0', cursor: 'pointer' }}
                    >
                      +24 س
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickEndTime(72)}
                      style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: 'none', borderRadius: '4px', padding: '3px 0', cursor: 'pointer' }}
                    >
                      +3 أيام
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickEndTime(168)}
                      style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: 'none', borderRadius: '4px', padding: '3px 0', cursor: 'pointer' }}
                    >
                      +أسبوع
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickEndTime(0)}
                      style={{ flex: 1, fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '3px 0', cursor: 'pointer' }}
                    >
                      مفتوح
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={generating}
                style={{
                  background: generating ? 'rgba(124, 58, 237, 0.5)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 35px',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 25px rgba(124, 58, 237, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s transform'
                }}
              >
                {generating ? (
                  <>
                    <div className="spinner" style={{ width: '22px', height: '22px', borderWidth: '3px' }}></div>
                    جاري التوليد الذكي...
                  </>
                ) : (
                  <>
                    <FaMagic /> توليد الكويز بالذكاء الاصطناعي الآن
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Loading Step Progress Animation Card */}
        {generating && (
          <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '16px', padding: '30px', textAlign: 'center', marginBottom: '35px' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 20px', border: '4px solid rgba(124, 58, 237, 0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px' }}>
              {loadingSteps[loadingStep]}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
              {loadingSteps.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '4px',
                    background: idx <= loadingStep ? 'linear-gradient(90deg, #7c3aed, #06b6d4)' : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.5s'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quiz Preview & Live Editor Section */}
        {previewQuestions.length > 0 && (
          <div id="quiz-preview-section" style={{ marginTop: '40px' }}>
            
            {/* Header of Preview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  ✅ جاهز للمعاينة والتعديل
                </span>
                <h2 style={{ fontSize: '1.6rem', color: 'white', fontWeight: '900', marginTop: '6px' }}>
                  معاينة وتعديل مسودة الكويز
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  يمكنك تعديل أي سؤال، تصحيح الخيارات، تغيير الإجابة الصحيحة أو الدرجات قبل الحفظ والاعتماد النهائي.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSaveQuizToDB}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {saving ? 'جاري الحفظ...' : <><FaSave /> اعتماد وحفظ الكويز في المنصة</>}
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FaRedo /> إعادة التوليد
                </button>
              </div>
            </div>

            {/* Quiz Info Summary Bar */}
            <div className="glass-card" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(124, 58, 237, 0.25)', borderRadius: '14px', padding: '20px', marginBottom: '25px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', alignItems: 'center' }}>
                
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>عنوان الكويز:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={previewTitle}
                    onChange={(e) => setPreviewTitle(e.target.value)}
                    style={{ background: 'rgba(10, 15, 29, 0.7)', color: '#fff', fontWeight: 'bold' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>كود الكويز:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={previewCode}
                      onChange={(e) => setPreviewCode(e.target.value.toUpperCase())}
                      style={{ background: 'rgba(10, 15, 29, 0.7)', color: '#a855f7', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyCode(previewCode)}
                      style={{ background: 'rgba(168, 85, 247, 0.15)', border: 'none', color: '#c084fc', padding: '0 12px', borderRadius: '8px', cursor: 'pointer' }}
                      title="نسخ الكود"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>المدة (بالدقائق):</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={previewDuration}
                    onChange={(e) => setPreviewDuration(parseInt(e.target.value) || 10)}
                    style={{ background: 'rgba(10, 15, 29, 0.7)', color: '#fff' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, background: 'rgba(30, 41, 59, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>إجمالي الأسئلة</span>
                    <strong style={{ fontSize: '1.2rem', color: '#38bdf8' }}>{previewQuestions.length}</strong>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(30, 41, 59, 0.6)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>إجمالي الدرجات</span>
                    <strong style={{ fontSize: '1.2rem', color: '#f59e0b' }}>{totalCalculatedMarks}</strong>
                  </div>
                </div>

              </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {previewQuestions.map((q, qIndex) => {
                const diffColor = q.difficulty === 'easy' ? '#10b981' : q.difficulty === 'hard' ? '#ef4444' : '#f59e0b';
                const diffLabel = q.difficulty === 'easy' ? 'سهل 🟢' : q.difficulty === 'hard' ? 'متقدم 🔴' : 'متوسط 🟡';

                return (
                  <div
                    key={qIndex}
                    className="glass-card"
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '22px',
                      position: 'relative'
                    }}
                  >
                    {/* Question Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#7c3aed', color: 'white', fontWeight: 'bold', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                          {qIndex + 1}
                        </span>
                        <span className="badge" style={{ backgroundColor: `${diffColor}22`, color: diffColor, border: `1px solid ${diffColor}44`, fontWeight: 'bold' }}>
                          {diffLabel}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>الدرجة:</span>
                          <input
                            type="number"
                            min="1"
                            value={q.marks}
                            onChange={(e) => updateQuestionField(qIndex, 'marks', parseInt(e.target.value) || 1)}
                            style={{
                              width: '50px',
                              background: 'rgba(10, 15, 29, 0.8)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              borderRadius: '4px',
                              textAlign: 'center',
                              padding: '2px 4px',
                              fontSize: '0.85rem'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="حذف هذا السؤال"
                      >
                        <FaTrash /> حذف السؤال
                      </button>
                    </div>

                    {/* Question Text */}
                    <div style={{ marginBottom: '16px' }}>
                      <textarea
                        className="form-input"
                        value={q.question_text}
                        onChange={(e) => updateQuestionField(qIndex, 'question_text', e.target.value)}
                        placeholder="نص السؤال..."
                        style={{
                          background: 'rgba(10, 15, 29, 0.7)',
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          minHeight: '65px',
                          lineHeight: '1.5'
                        }}
                      />
                    </div>

                    {/* 4 Options Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                      {[
                        { letter: 'a', label: 'الخيار (أ)', field: 'option_a' },
                        { letter: 'b', label: 'الخيار (ب)', field: 'option_b' },
                        { letter: 'c', label: 'الخيار (ج)', field: 'option_c' },
                        { letter: 'd', label: 'الخيار (د)', field: 'option_d' }
                      ].map((opt) => {
                        const isCorrect = (q.correct_answer || 'a').toLowerCase() === opt.letter;

                        return (
                          <div
                            key={opt.letter}
                            onClick={() => handleCorrectAnswerChange(qIndex, opt.letter)}
                            style={{
                              background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(10, 15, 29, 0.6)',
                              border: isCorrect ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              padding: '10px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isCorrect ? '#10b981' : '#94a3b8' }}>
                                {opt.label} {isCorrect && '✅ (الإجابة الصحيحة)'}
                              </span>
                              <input
                                type="radio"
                                name={`correct_q_${qIndex}`}
                                checked={isCorrect}
                                onChange={() => handleCorrectAnswerChange(qIndex, opt.letter)}
                                style={{ accentColor: '#10b981', cursor: 'pointer' }}
                              />
                            </div>
                            <input
                              type="text"
                              value={q[opt.field]}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateQuestionField(qIndex, opt.field, e.target.value)}
                              placeholder={`نص ${opt.label}`}
                              style={{
                                width: '100%',
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#fff',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                fontSize: '0.85rem'
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #06b6d4' }}>
                      <label style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        <FaLightbulb /> التفسير والشرح التعليمي:
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => updateQuestionField(qIndex, 'explanation', e.target.value)}
                        placeholder="تفسير سبب صحة هذا الخيار..."
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          color: '#cbd5e1',
                          fontSize: '0.85rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Add Manual Question Button & Final Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px', flexWrap: 'wrap', gap: '15px' }}>
              <button
                type="button"
                onClick={handleAddQuestion}
                style={{
                  background: 'rgba(30, 41, 59, 0.9)',
                  color: '#38bdf8',
                  border: '1px dashed #38bdf8',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaPlus /> إضافة سؤال إضافي يدوياً
              </button>

              <button
                type="button"
                onClick={handleSaveQuizToDB}
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
                }}
              >
                {saving ? 'جاري الحفظ...' : <><FaSave /> حفظ ونشر الكويز النهائي</>}
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default AdminAIQuizGenerator;
