/**
 * توليد تقرير PDF عربي كامل للطالب باستخدام html2pdf.js
 * يعرض التقرير داخل div مخفي ثم يحوله لـ PDF مع دعم كامل للعربية
 */
export async function generateStudentPDF(student) {
  // استيراد المكتبة ديناميكياً
  const html2pdf = (await import('html2pdf.js')).default;

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatDateTime = (iso) => {
    if (!iso) return 'غير نشط مؤخراً';
    return new Date(iso).toLocaleString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // بناء صفوف الامتحانات
  const examRows = (student.exam_attempts || []).map((a, i) => `
    <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8faff'};">
      <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb; font-weight:600;">${a.exam_title}</td>
      <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb; text-align:center; color:#2563eb; font-family:monospace;">${a.exam_code}</td>
      <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb; text-align:center; font-weight:bold;">${a.score} / ${a.total_marks}</td>
      <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb; text-align:center; font-weight:bold; color:${a.percentage >= 50 ? '#059669' : '#dc2626'};">${a.percentage}%</td>
      <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb; text-align:center; color:#7c3aed; font-weight:bold;">${a.duration_str}</td>
      <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb; text-align:center; color:#6b7280;">${formatDate(a.submitted_at)}</td>
      <td style="padding:8px 10px; border-bottom:1px solid #e5e7eb; text-align:center;">
        <span style="background:${a.is_cheated ? '#fef2f2' : '#f0fdf4'}; color:${a.is_cheated ? '#dc2626' : '#059669'}; padding:2px 8px; border-radius:20px; font-size:0.8rem; font-weight:bold;">
          ${a.is_cheated ? '⚠️ مخالفة (غش)' : '✓ سليمة'}
        </span>
      </td>
    </tr>
  `).join('');

  // بناء بلوكات الكورسات
  const courseBlocks = (student.courses || []).map(c => {
    const cardPct = c.total_cards > 0 ? Math.round((c.cards_completed / c.total_cards) * 100) : 0;
    const qPct = c.total_questions > 0 ? Math.round((c.answered_questions / c.total_questions) * 100) : 0;
    return `
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:10px; padding:16px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <span style="background:#dbeafe; color:#1d4ed8; padding:3px 10px; border-radius:20px; font-size:0.8rem; font-weight:bold; margin-left:8px;">${c.course_code}</span>
            <strong style="font-size:1rem; color:#111827;">${c.course_title}</strong>
          </div>
          <span style="color:#9ca3af; font-size:0.82rem;">تسجيل منذ: ${formatDate(c.registered_at)}</span>
        </div>

        <div style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
            <span style="color:#374151;">✅ إنجاز الكروت والدروس</span>
            <strong style="color:#059669;">${c.cards_completed} / ${c.total_cards} (${cardPct}%)</strong>
          </div>
          <div style="background:#e5e7eb; border-radius:10px; height:10px; overflow:hidden;">
            <div style="background:linear-gradient(90deg,#059669,#10b981); height:100%; width:${cardPct}%; border-radius:10px;"></div>
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
            <span style="color:#374151;">❓ أسئلة الكروت المجابة</span>
            <strong style="color:#d97706;">${c.answered_questions} / ${c.total_questions} (${qPct}%)</strong>
          </div>
          <div style="background:#e5e7eb; border-radius:10px; height:10px; overflow:hidden;">
            <div style="background:linear-gradient(90deg,#d97706,#f59e0b); height:100%; width:${qPct}%; border-radius:10px;"></div>
          </div>
        </div>

        ${c.completed_cards_details?.length > 0 ? `
        <div style="margin-top:10px; padding:10px; background:#f0fdf4; border-radius:8px; border:1px solid #bbf7d0;">
          <div style="font-size:0.8rem; color:#059669; font-weight:bold; margin-bottom:8px;">✅ الكروت المكتملة (${c.completed_cards_details.length}):</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${c.completed_cards_details.map((card, idx) => `
              <span style="background:#dcfce7; color:#166534; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:bold;">
                ${idx + 1}. ${card.card_title}
              </span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${c.answered_questions_details?.length > 0 ? `
        <div style="margin-top:10px; padding:10px; background:#fffbeb; border-radius:8px; border:1px solid #fde68a;">
          <div style="font-size:0.8rem; color:#d97706; font-weight:bold; margin-bottom:8px;">❓ الأسئلة المحلولة (${c.answered_questions_details.length}):</div>
          <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
            <thead>
              <tr style="background:#fef3c7;">
                <th style="padding:5px 8px; text-align:right; border-bottom:1px solid #fde68a; color:#92400e;">الكارت</th>
                <th style="padding:5px 8px; text-align:center; border-bottom:1px solid #fde68a; color:#92400e; white-space:nowrap;"># السؤال</th>
                <th style="padding:5px 8px; text-align:right; border-bottom:1px solid #fde68a; color:#92400e;">نص السؤال (مختصر)</th>
              </tr>
            </thead>
            <tbody>
              ${c.answered_questions_details.map((q, i) => `
                <tr style="background:${i % 2 === 0 ? '#fffbeb' : '#fff'};">
                  <td style="padding:5px 8px; border-bottom:1px solid #fde68a; font-weight:600; color:#78350f;">${q.card_title}</td>
                  <td style="padding:5px 8px; border-bottom:1px solid #fde68a; text-align:center; font-weight:bold; color:#d97706;">${q.question_number}</td>
                  <td style="padding:5px 8px; border-bottom:1px solid #fde68a; color:#374151;">${q.question_preview}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      </div>
    `;
  }).join('');


  const evaluationColor = {
    'ممتاز 🏆': '#059669',
    'جيد جداً ⭐': '#2563eb',
    'جيد 👍': '#7c3aed',
    'مقبول 📁': '#d97706',
  }[student.evaluation] || '#dc2626';

  const html = `
    <div id="pdf-report" style="
      font-family: 'Segoe UI', 'Cairo', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #111827;
      background: #f9fafb;
      padding: 0;
      width: 794px;
    ">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 28px 32px; margin-bottom: 0;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h1 style="color:#ffffff; font-size:1.6rem; font-weight:800; margin:0 0 6px;">📋 تقرير أداء الطالب الشامل</h1>
            <p style="color:#93c5fd; font-size:0.85rem; margin:0;">تاريخ الإصدار: ${new Date().toLocaleString('ar-EG')}</p>
          </div>
          <div style="text-align:left;">
            <div style="background:rgba(255,255,255,0.1); border-radius:10px; padding:10px 16px; text-align:center;">
              <div style="color:#fbbf24; font-size:1.4rem; font-weight:800;">${student.overall_score}%</div>
              <div style="color:#e2e8f0; font-size:0.75rem;">التقييم الإجمالي</div>
            </div>
          </div>
        </div>
      </div>

      <div style="padding: 24px 32px;">

        <!-- Student Info Card -->
        <div style="background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:20px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <h2 style="font-size:1.05rem; font-weight:800; color:#1e3a5f; border-right:4px solid #2563eb; padding-right:10px; margin:0 0 16px;">👤 البيانات الشخصية</h2>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div style="background:#f8faff; padding:12px 14px; border-radius:8px;">
              <div style="color:#6b7280; font-size:0.78rem; margin-bottom:3px;">الاسم الكامل</div>
              <div style="font-weight:700; font-size:1rem; color:#111827;">${student.name}</div>
            </div>
            <div style="background:#f8faff; padding:12px 14px; border-radius:8px;">
              <div style="color:#6b7280; font-size:0.78rem; margin-bottom:3px;">البريد الإلكتروني</div>
              <div style="font-weight:700; font-size:0.9rem; color:#2563eb; direction:ltr; text-align:right;">${student.email}</div>
            </div>
            <div style="background:#f8faff; padding:12px 14px; border-radius:8px;">
              <div style="color:#6b7280; font-size:0.78rem; margin-bottom:3px;">حالة الحساب</div>
              <div style="font-weight:700; color:${student.is_verified ? '#059669' : '#d97706'};">${student.is_verified ? '✓ مفعّل ومؤكد' : '⏳ في انتظار التفعيل'}</div>
            </div>
            <div style="background:#f8faff; padding:12px 14px; border-radius:8px;">
              <div style="color:#6b7280; font-size:0.78rem; margin-bottom:3px;">التقييم العام</div>
              <div style="font-weight:800; font-size:1.05rem; color:${evaluationColor};">${student.evaluation || '—'}</div>
            </div>
          </div>
        </div>

        <!-- Stats Row -->
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-bottom:20px;">
          <div style="background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:16px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-size:1.8rem; font-weight:800; color:#2563eb;">${student.overall_score}%</div>
            <div style="color:#6b7280; font-size:0.75rem; margin-top:4px;">التقييم الإجمالي</div>
          </div>
          <div style="background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:16px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-size:1.8rem; font-weight:800; color:#7c3aed;">${student.avg_exam_pct}%</div>
            <div style="color:#6b7280; font-size:0.75rem; margin-top:4px;">متوسط الامتحانات</div>
          </div>
          <div style="background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:16px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-size:1.8rem; font-weight:800; color:#059669;">${student.daily_active_str || '0ث'}</div>
            <div style="color:#6b7280; font-size:0.75rem; margin-top:4px;">نشاط اليوم</div>
          </div>
          <div style="background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:16px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-size:1.8rem; font-weight:800; color:#d97706;">${student.exam_attempts?.length || 0}</div>
            <div style="color:#6b7280; font-size:0.75rem; margin-top:4px;">اختبارات منجزة</div>
          </div>
        </div>

        <!-- Activity -->
        <div style="background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; padding:16px 20px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <h2 style="font-size:1.05rem; font-weight:800; color:#1e3a5f; border-right:4px solid #7c3aed; padding-right:10px; margin:0 0 12px;">⏱️ النشاط والحضور على المنصة</h2>
          <div style="display:flex; gap:24px; flex-wrap:wrap;">
            <div>
              <span style="color:#6b7280; font-size:0.82rem;">🕒 آخر ظهور: </span>
              <strong>${formatDateTime(student.last_active)}</strong>
            </div>
            <div>
              <span style="color:#6b7280; font-size:0.82rem;">⏱️ مدة اليوم النشط: </span>
              <strong style="color:#7c3aed;">${student.daily_active_str || '0ث'}</strong>
            </div>
            <div>
              <span style="color:#6b7280; font-size:0.82rem;">📚 الكورسات المسجلة: </span>
              <strong>${student.courses?.length || 0}</strong>
            </div>
          </div>
        </div>

        <!-- Course Progress -->
        <div style="margin-bottom:20px;">
          <h2 style="font-size:1.05rem; font-weight:800; color:#1e3a5f; border-right:4px solid #059669; padding-right:10px; margin:0 0 14px;">📂 تقدم الكورسات والدروس</h2>
          ${student.courses?.length > 0 ? courseBlocks : '<div style="color:#9ca3af; font-style:italic; padding:16px; background:#fff; border-radius:10px; border:1px solid #e5e7eb;">لم يسجل في أي كورس بعد.</div>'}
        </div>

        <!-- Exam Table -->
        <div style="margin-bottom:20px;">
          <h2 style="font-size:1.05rem; font-weight:800; color:#1e3a5f; border-right:4px solid #d97706; padding-right:10px; margin:0 0 14px;">📝 تفاصيل الاختبارات ونتائجها</h2>
          ${student.exam_attempts?.length > 0 ? `
            <div style="border-radius:10px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
              <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #0f172a, #1e3a5f); color:#ffffff;">
                    <th style="padding:10px 12px; text-align:right; font-weight:700;">اسم الامتحان</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:700;">الكود</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:700;">الدرجة</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:700;">النسبة</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:700;">الوقت</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:700;">تاريخ التسليم</th>
                    <th style="padding:10px 12px; text-align:center; font-weight:700;">النزاهة</th>
                  </tr>
                </thead>
                <tbody>${examRows}</tbody>
              </table>
            </div>
          ` : '<div style="color:#9ca3af; font-style:italic; padding:16px; background:#fff; border-radius:10px; border:1px solid #e5e7eb;">لم يقم بأداء أي اختبارات بعد.</div>'}
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #e5e7eb; padding-top:14px; margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#9ca3af; font-size:0.75rem;">منصة الاختبارات الإلكترونية — تقرير سري خاص بالطالب</span>
          <span style="color:#9ca3af; font-size:0.75rem;">صدر بتاريخ: ${new Date().toLocaleDateString('ar-EG')}</span>
        </div>

      </div>
    </div>
  `;

  // إنشاء container مؤقت خارج الشاشة
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#f9fafb';
  document.body.appendChild(container);

  const element = container.querySelector('#pdf-report');

  const options = {
    margin: 0,
    filename: `تقرير_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().set(options).from(element).save();
  } finally {
    document.body.removeChild(container);
  }
}
