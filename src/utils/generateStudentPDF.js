import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a comprehensive PDF report for a student.
 * Uses jsPDF + jspdf-autotable (no Arabic text in the PDF library itself,
 * so we write data in a structured English+Arabic-compatible layout).
 *
 * @param {Object} student - The full student data object from /admin/students-overview
 */
export function generateStudentPDF(student) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  const line = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  const section = (title) => {
    y += 3;
    doc.setFillColor(30, 60, 120);
    doc.roundedRect(margin, y, pageW - margin * 2, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 4, y + 6.5);
    doc.setTextColor(0, 0, 0);
    y += 14;
  };

  const kv = (label, value, indent = margin) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(label + ':', indent, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(String(value ?? '—'), indent + 55, y);
    y += 6.5;
  };

  const checkPageBreak = (needed = 30) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // ─── Header ───────────────────────────────────────────
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Student Performance Report', margin, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 200, 255);
  doc.text('Generated: ' + new Date().toLocaleString('en-GB'), margin, 21);
  doc.text('Platform: Exam Management System', pageW - margin - 80, 21);

  y = 40;
  doc.setTextColor(0, 0, 0);

  // ─── 1. Basic Info ────────────────────────────────────
  section('1. Student Information');
  kv('Name', student.name);
  kv('Email', student.email);
  kv('Account Status', student.is_verified ? 'Verified' : 'Pending Verification');
  kv('Overall Evaluation', student.evaluation || '—');
  kv('Overall Score', student.overall_score + '%');
  kv('Avg. Exam Score', student.avg_exam_pct + '%');

  // ─── 2. Activity ─────────────────────────────────────
  section('2. Activity & Online Presence');
  kv('Last Active', student.last_active ? new Date(student.last_active).toLocaleString('en-GB') : 'No activity yet');
  kv("Today's Active Time", student.daily_active_str || '0s');
  kv('Exams Completed', String(student.exam_attempts?.length || 0));
  kv('Courses Enrolled', String(student.courses?.length || 0));

  // ─── 3. Course Progress ───────────────────────────────
  checkPageBreak(50);
  section('3. Course Progress Details');

  if (student.courses && student.courses.length > 0) {
    student.courses.forEach((c) => {
      checkPageBreak(40);
      const cardPct = c.total_cards > 0 ? Math.round((c.cards_completed / c.total_cards) * 100) : 0;
      const qPct = c.total_questions > 0 ? Math.round((c.answered_questions / c.total_questions) * 100) : 0;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 80, 200);
      doc.text('[' + c.course_code + '] ' + c.course_title, margin, y);
      y += 6;
      doc.setTextColor(0, 0, 0);

      kv('  Registered At', c.registered_at ? new Date(c.registered_at).toLocaleDateString('en-GB') : '—', margin);
      kv('  Cards Completed', c.cards_completed + ' / ' + c.total_cards + ' (' + cardPct + '%)', margin);
      kv('  Questions Answered', c.answered_questions + ' / ' + c.total_questions + ' (' + qPct + '%)', margin);
      y += 2;
      line();
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('No courses enrolled.', margin, y);
    y += 8;
  }

  // ─── 4. Exam Attempts Table ───────────────────────────
  checkPageBreak(50);
  section('4. Exam Attempts & Results');

  if (student.exam_attempts && student.exam_attempts.length > 0) {
    const rows = student.exam_attempts.map((a) => [
      a.exam_title,
      a.exam_code,
      a.score + ' / ' + a.total_marks,
      a.percentage + '%',
      a.duration_str,
      a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-GB') : 'Not submitted',
      a.is_cheated ? 'Cheating Detected' : 'Clean',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Exam Title', 'Code', 'Score', '%', 'Duration', 'Date', 'Integrity']],
      body: rows,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        textColor: [20, 20, 20],
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 22 },
        3: { cellWidth: 14 },
        4: { cellWidth: 22 },
        5: { cellWidth: 28 },
        6: { cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('No exam attempts recorded.', margin, y);
    y += 10;
  }

  // ─── Footer ───────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text('Exam Platform – Confidential Student Report', margin, pageH - 8);
    doc.text('Page ' + p + ' of ' + totalPages, pageW - margin - 25, pageH - 8);
  }

  // ─── Save ────────────────────────────────────────────
  const fileName = 'Report_' + student.name.replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(fileName);
}
