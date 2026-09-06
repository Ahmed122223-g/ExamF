import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Generate official Certificate PDF in English (Coursera & edX style)
 * Clean typography without boxed cards, single-page A4 landscape diploma.
 */
export async function generateCertificatePDF(certificate) {
  // Detect if a string contains Arabic characters
  const isArabic = (text) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

  const formatDate = (iso) => {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Arabic-aware text style: uses Cairo font + RTL when Arabic is detected
  const textStyle = (text, baseStyle = '') => {
    if (isArabic(text)) {
      return `font-family:'Cairo',sans-serif;direction:rtl;unicode-bidi:embed;${baseStyle}`;
    }
    return baseStyle;
  };

  const getEnglishGrade = (grade, score) => {
    if (score >= 90) return 'Excellent with Honors';
    if (score >= 80) return 'Very Good';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Pass';
    return grade && !grade.includes('ممتاز') && !grade.includes('جيد') ? grade : 'Satisfactory';
  };

  const gradeText = getEnglishGrade(certificate.final_grade, certificate.final_score);

  const scoreColor = certificate.final_score >= 90
    ? '#b8860b'
    : certificate.final_score >= 80
    ? '#15803d'
    : certificate.final_score >= 65
    ? '#1d4ed8'
    : '#b91c1c';

  // Ensure fonts are ready before capturing (including Cairo for Arabic)
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  // Force-load Cairo font weights used in the certificate
  try {
    await Promise.all([
      document.fonts.load('900 38px Cairo'),
      document.fonts.load('900 28px Cairo'),
      document.fonts.load('900 32px Cinzel'),
      document.fonts.load('900 22px Cinzel'),
    ]);
  } catch (e) { /* ignore font load errors */ }

  // Create isolated rendering element fixed at exact 1122x793 A4 landscape dimensions
  const container = document.createElement('div');
  container.id = 'print-certificate-container';
  container.style.cssText = [
    'position: fixed',
    'left: 0',
    'top: 0',
    'width: 1122px',
    'height: 793px',
    'z-index: -9999',
    'opacity: 1',
    'pointer-events: none',
    'background: #ffffff',
    'box-sizing: border-box',
    'overflow: hidden',
    'font-family: "Montserrat", "Segoe UI", Tahoma, sans-serif'
  ].join(';');

  container.innerHTML = `
<div style="width:1122px;height:793px;position:relative;background:#ffffff;box-sizing:border-box;overflow:hidden;font-family:'Montserrat',sans-serif;color:#0f172a;direction:ltr;">
  <!-- Outer Dark Navy Border -->
  <div style="position:absolute;inset:18px;border:4px solid #0f172a;border-radius:10px;pointer-events:none;box-sizing:border-box;"></div>
  
  <!-- Inner Gold Borders -->
  <div style="position:absolute;inset:26px;border:1.5px solid #d4af37;border-radius:7px;pointer-events:none;box-sizing:border-box;"></div>
  <div style="position:absolute;inset:30px;border:1px solid rgba(212,175,55,0.35);border-radius:5px;pointer-events:none;box-sizing:border-box;"></div>

  <!-- Gold Corner Accents -->
  <div style="position:absolute;top:28px;left:28px;width:34px;height:34px;border-top:3.5px solid #d4af37;border-left:3.5px solid #d4af37;z-index:5;"></div>
  <div style="position:absolute;top:28px;right:28px;width:34px;height:34px;border-top:3.5px solid #d4af37;border-right:3.5px solid #d4af37;z-index:5;"></div>
  <div style="position:absolute;bottom:28px;left:28px;width:34px;height:34px;border-bottom:3.5px solid #d4af37;border-left:3.5px solid #d4af37;z-index:5;"></div>
  <div style="position:absolute;bottom:28px;right:28px;width:34px;height:34px;border-bottom:3.5px solid #d4af37;border-right:3.5px solid #d4af37;z-index:5;"></div>

  <!-- Main Certificate Body -->
  <div style="position:relative;z-index:10;width:100%;height:100%;padding:40px 52px 32px 52px;display:flex;flex-direction:column;justify-content:space-between;text-align:center;box-sizing:border-box;">
    
    <!-- Top Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid rgba(212,175,55,0.35);padding-bottom:12px;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:7px 16px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Credential ID:</span>
        <span style="font-family:'Courier New',monospace;color:#b8860b;font-weight:800;font-size:12px;letter-spacing:0.04em;">${certificate.certificate_code}</span>
      </div>
      <div style="text-align:right;">
        <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:900;color:#0f172a;letter-spacing:0.18em;line-height:1.1;">EXAMPF ACADEMY</div>
        <div style="font-size:9.5px;color:#b8860b;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-top:3px;">Accredited Online Examination & Learning Platform</div>
      </div>
    </div>

    <!-- Title Block -->
    <div style="margin:4px 0 0 0;">
      <h1 style="font-family:'Cinzel',serif;font-size:32px;font-weight:900;color:#0f172a;letter-spacing:0.12em;line-height:1.15;text-transform:uppercase;margin:0;">Certificate of Achievement</h1>
      <div style="font-size:11px;font-weight:700;color:#d4af37;letter-spacing:0.28em;text-transform:uppercase;margin-top:4px;">Official Certificate of Academic Completion</div>
      <div style="width:260px;height:2px;background:linear-gradient(90deg,transparent,#d4af37,#0f172a,#d4af37,transparent);margin:8px auto 6px auto;"></div>
    </div>

    <!-- Recipient Content -->
    <div style="margin:0;">
      <p style="font-size:13px;color:#64748b;font-weight:600;margin:0 0 4px 0;letter-spacing:0.04em;">This is to certify that</p>
      <div style="display:inline-block;padding:2px 42px;border-bottom:2.5px solid #d4af37;margin:2px 0 6px 0;">
        <span style="font-size:38px;font-weight:900;color:#0f172a;letter-spacing:0.02em;${textStyle(certificate.student_name)}">${certificate.student_name}</span>
      </div>
      <p style="font-size:12.5px;color:#64748b;font-weight:600;margin:6px auto 4px auto;max-width:740px;line-height:1.45;">has successfully completed and fulfilled all academic requirements, evaluations, and coursework for:</p>
      <div style="font-size:28px;font-weight:900;color:#1e3a8a;letter-spacing:0.02em;margin:4px 0 6px 0;${textStyle(certificate.course_title)}">${certificate.course_title}</div>
    </div>

    <!-- Clean Typography Credentials Line (NO BOXES) -->
    <div style="display:flex;justify-content:center;align-items:center;gap:36px;margin:0 auto 10px auto;max-width:820px;padding:10px 0;border-top:1px solid rgba(212,175,55,0.3);border-bottom:1px solid rgba(212,175,55,0.3);box-sizing:border-box;">
      <div style="text-align:center;">
        <span style="font-size:20px;font-weight:900;color:${scoreColor};display:block;line-height:1.15;">${certificate.final_score}%</span>
        <span style="font-size:9.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;display:block;">Final Score</span>
      </div>
      <div style="width:1px;height:32px;background:rgba(212,175,55,0.4);"></div>
      <div style="text-align:center;">
        <span style="font-size:16px;font-weight:900;color:#0f172a;display:block;line-height:1.15;">${gradeText}</span>
        <span style="font-size:9.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;display:block;">Academic Standing</span>
      </div>
      <div style="width:1px;height:32px;background:rgba(212,175,55,0.4);"></div>
      <div style="text-align:center;">
        <span style="font-size:16px;font-weight:900;color:#0284c7;display:block;line-height:1.15;">${certificate.time_spent_formatted || '1 Day'}</span>
        <span style="font-size:9.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;display:block;">Course Duration</span>
      </div>
      <div style="width:1px;height:32px;background:rgba(212,175,55,0.4);"></div>
      <div style="text-align:center;">
        <span style="font-size:15px;font-weight:800;color:#0f172a;display:block;line-height:1.15;">${formatDate(certificate.issued_at)}</span>
        <span style="font-size:9.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;display:block;">Date of Issuance</span>
      </div>
    </div>

    <!-- Bottom Footer -->
    <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-top:10px;border-top:1px solid #e2e8f0;">
      <!-- Verification Info (Left) -->
      <div style="text-align:left;font-size:8.5px;color:#475569;line-height:1.45;min-width:210px;">
        <div style="font-weight:800;color:#0f172a;font-size:9.5px;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;">Official Verification Portal</div>
        <div>Verify authenticity of this credential at:</div>
        <div style="color:#0284c7;font-family:monospace;font-size:8.5px;font-weight:700;word-break:break-all;">exampf.vercel.app/verify-certificate</div>
        <div style="font-size:7.5px;color:#94a3b8;margin-top:2px;">Secured by ExamPF Integrity Engine</div>
      </div>

      <!-- Center Seal -->
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:70px;height:70px;background:radial-gradient(circle,#fef08a 0%,#eab308 60%,#ca8a04 100%);border:3px solid #a16207;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(161,98,7,0.35);">
          <div style="width:56px;height:56px;border:1px dashed #713f12;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
            <span style="font-size:16px;line-height:1;">🎓</span>
            <span style="font-size:6.5px;font-weight:900;color:#713f12;letter-spacing:0.12em;line-height:1.1;margin-top:2px;">VERIFIED</span>
            <span style="font-size:6.5px;font-weight:900;color:#713f12;letter-spacing:0.12em;line-height:1.1;">EXAMPF</span>
          </div>
        </div>
      </div>

      <!-- Signature (Right) -->
      <div style="text-align:right;min-width:210px;">
        <div style="font-family:'Alex Brush','Brush Script MT',cursive;font-size:32px;color:#1e3a8a;font-weight:bold;transform:rotate(-2deg);margin-bottom:2px;line-height:1;">
          ExamPF Academic Board
        </div>
        <div style="width:170px;height:1px;background:#94a3b8;margin:0 0 4px auto;"></div>
        <div style="font-size:10px;font-weight:800;color:#0f172a;letter-spacing:0.02em;">Academic Affairs & Verification Board</div>
        <div style="font-size:8.5px;color:#64748b;">Examination & Evaluation Committee</div>
      </div>
    </div>

  </div>
</div>
`;

  document.body.appendChild(container);

  // Delay to ensure Arabic + Latin font glyphs are fully painted
  await new Promise((resolve) => setTimeout(resolve, 400));

  try {
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 1122,
      height: 793,
      windowWidth: 1122,
      windowHeight: 793
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');

    const cleanStudentName = certificate.student_name.replace(/\s+/g, '_');
    pdf.save(`Certificate_ExamPF_${cleanStudentName}_${certificate.certificate_code}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
