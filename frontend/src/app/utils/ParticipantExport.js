import { jsPDF } from 'jspdf';

/**
 * Export participant data as a CSV file (opens as Excel).
 *
 * @param {Object} opts
 * @param {string} opts.eventName
 * @param {string} opts.eventDate
 * @param {Array} opts.participants - Array of { userName, userEmail, department, semester, phoneNumber, attended, attendedAt }
 */
export function exportParticipantsToExcel({ eventName, eventDate, participants }) {
    const headers = ['#', 'Name', 'Email', 'Department', 'Semester', 'Phone', 'Status', 'Attended At'];

    const rows = participants.map((p, idx) => [
        idx + 1,
        p.userName || '',
        p.userEmail || '',
        p.department || '',
        p.semester || '',
        p.phoneNumber || '',
        p.attended ? 'Attended' : 'Registered',
        p.attendedAt ? new Date(p.attendedAt).toLocaleString() : '-',
    ]);

    // Build CSV content
    const csvContent = [
        [`Event: ${eventName}`, `Date: ${eventDate}`],
        [],
        headers,
        ...rows,
        [],
        [`Total Registered: ${participants.length}`],
        [`Total Attended: ${participants.filter(p => p.attended).length}`],
    ]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    // Download as CSV
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (eventName || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `Participants_${safeName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Export participant data as a PDF file.
 *
 * @param {Object} opts
 * @param {string} opts.eventName
 * @param {string} opts.clubName
 * @param {string} opts.eventDate
 * @param {string} opts.venue
 * @param {Array} opts.participants
 */
export function exportParticipantsToPDF({ eventName, clubName, eventDate, venue, participants }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    let y = 15;

    // ── Header ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text('Participant Report', W / 2, y, { align: 'center' });

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(eventName || 'Event', W / 2, y, { align: 'center' });

    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateStr = eventDate
        ? new Date(eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : '';
    const subParts = [];
    if (clubName) subParts.push(`Club: ${clubName}`);
    if (dateStr) subParts.push(`Date: ${dateStr}`);
    if (venue) subParts.push(`Venue: ${venue}`);
    doc.text(subParts.join('   |   '), W / 2, y, { align: 'center' });

    // ── Summary ──
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    const totalRegistered = participants.length;
    const totalAttended = participants.filter(p => p.attended).length;
    doc.text(`Total Registered: ${totalRegistered}    |    Total Attended: ${totalAttended}`, W / 2, y, { align: 'center' });

    // ── Separator ──
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, y, W - 15, y);

    // ── Table header ──
    y += 8;
    const colX = [15, 22, 65, 110, 140, 160, 185];
    const colLabels = ['#', 'Name', 'Email', 'Dept', 'Sem', 'Phone', 'Status'];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(30, 58, 138);
    doc.rect(14, y - 4, W - 28, 6, 'F');
    colLabels.forEach((label, i) => {
        doc.text(label, colX[i], y);
    });

    // ── Table rows ──
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    y += 6;

    participants.forEach((p, idx) => {
        // Page break if needed
        if (y > 275) {
            doc.addPage();
            y = 15;

            // Re-draw header on new page
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(30, 58, 138);
            doc.rect(14, y - 4, W - 28, 6, 'F');
            colLabels.forEach((label, i) => {
                doc.text(label, colX[i], y);
            });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            y += 6;
        }

        // Alternating row background
        if (idx % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(14, y - 3.5, W - 28, 5, 'F');
        }

        doc.setTextColor(60, 60, 60);
        doc.text(String(idx + 1), colX[0], y);
        doc.text((p.userName || '').substring(0, 22), colX[1], y);
        doc.text((p.userEmail || '').substring(0, 25), colX[2], y);
        doc.text((p.department || '-').substring(0, 15), colX[3], y);
        doc.text((p.semester || '-').substring(0, 8), colX[4], y);
        doc.text((p.phoneNumber || '-').substring(0, 12), colX[5], y);

        if (p.attended) {
            doc.setTextColor(22, 163, 74); // green
            doc.text('Attended', colX[6], y);
        } else {
            doc.setTextColor(150, 150, 150);
            doc.text('Registered', colX[6], y);
        }

        y += 5;
    });

    // ── Footer ──
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, W - 15, y);
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated on ${new Date().toLocaleString()}  |  College Event Management System`, W / 2, y, { align: 'center' });

    // ── Download ──
    const safeName = (eventName || 'Event').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Participants_${safeName}.pdf`);
}
