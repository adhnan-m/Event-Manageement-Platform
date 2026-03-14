import { jsPDF } from 'jspdf';

/**
 * Generate and download a professional participation certificate as PDF.
 *
 * @param {Object} opts
 * @param {string} opts.studentName
 * @param {string} opts.eventName
 * @param {string} opts.clubName
 * @param {string} opts.eventDate   – ISO date string or displayable date
 * @param {string} opts.venue
 * @param {string} [opts.attendedAt] – ISO timestamp when attendance was marked
 */
export function generateCertificate({ studentName, eventName, clubName, eventDate, venue, attendedAt }) {
    // Landscape A4
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297;
    const H = 210;

    // ── Background ──
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, 'F');

    // ── Outer decorative border ──
    const borderMargin = 8;
    doc.setDrawColor(30, 58, 138);   // dark blue
    doc.setLineWidth(2);
    doc.rect(borderMargin, borderMargin, W - borderMargin * 2, H - borderMargin * 2);

    // Inner border
    const innerMargin = 12;
    doc.setDrawColor(59, 130, 246);  // blue-500
    doc.setLineWidth(0.5);
    doc.rect(innerMargin, innerMargin, W - innerMargin * 2, H - innerMargin * 2);

    // ── Corner decorations ──
    const cornerSize = 20;
    const corners = [
        [innerMargin, innerMargin],
        [W - innerMargin - cornerSize, innerMargin],
        [innerMargin, H - innerMargin - cornerSize],
        [W - innerMargin - cornerSize, H - innerMargin - cornerSize],
    ];
    doc.setFillColor(30, 58, 138);
    corners.forEach(([x, y]) => {
        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(1.5);
        // Small L-shaped corner marks
        doc.line(x, y, x + 12, y);
        doc.line(x, y, x, y + 12);
        doc.line(x + cornerSize, y + cornerSize, x + cornerSize - 12, y + cornerSize);
        doc.line(x + cornerSize, y + cornerSize, x + cornerSize, y + cornerSize - 12);
    });

    // ── Decorative top line ──
    doc.setDrawColor(234, 179, 8); // gold
    doc.setLineWidth(1);
    doc.line(60, 30, W - 60, 30);
    doc.setFillColor(234, 179, 8);
    doc.circle(60, 30, 2, 'F');
    doc.circle(W - 60, 30, 2, 'F');
    doc.circle(W / 2, 30, 2, 'F');

    // ── "CERTIFICATE" header ──
    let y = 45;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('COLLEGE EVENT MANAGEMENT SYSTEM', W / 2, y, { align: 'center' });

    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(30, 58, 138);
    doc.text('CERTIFICATE', W / 2, y, { align: 'center' });

    y += 12;
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('OF PARTICIPATION', W / 2, y, { align: 'center' });

    // ── Decorative separator ──
    y += 8;
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.8);
    doc.line(100, y, W - 100, y);

    // ── "This is to certify that" ──
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(80, 80, 80);
    doc.text('This is to certify that', W / 2, y, { align: 'center' });

    // ── Student name ──
    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(30, 58, 138);
    doc.text(studentName || 'Student', W / 2, y, { align: 'center' });

    // Underline under name
    const nameWidth = doc.getTextWidth(studentName || 'Student');
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.6);
    doc.line(W / 2 - nameWidth / 2 - 5, y + 2, W / 2 + nameWidth / 2 + 5, y + 2);

    // ── Event participation text ──
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(80, 80, 80);
    doc.text('has successfully participated in the event', W / 2, y, { align: 'center' });

    // ── Event name ──
    y += 13;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text(eventName || 'Event', W / 2, y, { align: 'center' });

    // ── Organized by ──
    y += 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`organized by ${clubName || 'College Club'}`, W / 2, y, { align: 'center' });

    // ── Event details ──
    y += 9;
    const eventDateFormatted = eventDate
        ? new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'N/A';
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    const detailParts = [`Date: ${eventDateFormatted}`];
    if (venue) detailParts.push(`Venue: ${venue}`);
    doc.text(detailParts.join('   |   '), W / 2, y, { align: 'center' });

    // ── Bottom decorative line ──
    y = H - 35;
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.8);
    doc.line(60, y, W - 60, y);
    doc.setFillColor(234, 179, 8);
    doc.circle(60, y, 2, 'F');
    doc.circle(W - 60, y, 2, 'F');
    doc.circle(W / 2, y, 2, 'F');

    // ── Footer ──
    y += 8;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const issuedDate = attendedAt
        ? new Date(attendedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    doc.text(`Issued on ${issuedDate}`, W / 2, y, { align: 'center' });

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('This certificate is auto-generated by the College Event Management System', W / 2, y, { align: 'center' });

    // ── Download ──
    const safeName = (eventName || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Certificate_${safeName}.pdf`);
}
