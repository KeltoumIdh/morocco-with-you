import PDFDocument from 'pdfkit';

export const generateCommissionReport = ({
  provider,
  bookings,
  period,
  totalRevenue,
  totalCommission,
}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(20).fillColor('#2C1F12').text('Morocco With You', 50, 50);
    doc.fontSize(12).fillColor('#8B7355').text(`Commission Report — ${period}`, 50, 80);
    doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#E8C4A0').stroke();

    doc.fontSize(14).fillColor('#1A1410').text(provider.name || 'Provider', 50, 120);
    doc
      .fontSize(11)
      .fillColor('#8B7355')
      .text(`${provider.city || ''} · ${provider.email || ''}`, 50, 140);
    doc.text(`Commission rate: ${provider.commission_rate || 10}%`, 50, 158);

    let y = 200;
    doc
      .fontSize(10)
      .fillColor('#8B7355')
      .text('Booking ID', 50, y)
      .text('Date', 180, y)
      .text('Service', 260, y)
      .text('Guests', 380, y)
      .text('Revenue', 430, y)
      .text('Commission', 490, y);

    doc.moveTo(50, y + 16).lineTo(545, y + 16).strokeColor('#E8C4A0').stroke();
    y += 26;

    (bookings || []).forEach((b) => {
      doc
        .fontSize(10)
        .fillColor('#1A1410')
        .text(String(b.id || '').slice(0, 8).toUpperCase(), 50, y)
        .text(
          new Date(b.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          180,
          y
        )
        .text(b.service || '—', 260, y, { width: 110 })
        .text(String(b.guests || 1), 380, y)
        .text(`€${Number(b.total_amount || 0).toFixed(2)}`, 430, y)
        .text(`€${Number(b.commission_total || 0).toFixed(2)}`, 490, y);

      y += 22;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveTo(50, y + 8).lineTo(545, y + 8).strokeColor('#E8C4A0').stroke();
    y += 24;

    doc
      .fontSize(12)
      .fillColor('#1A1410')
      .text('Total Revenue:', 350, y)
      .text(`€${Number(totalRevenue || 0).toFixed(2)}`, 460, y);
    y += 20;
    doc
      .fontSize(13)
      .fillColor('#C0654A')
      .font('Helvetica-Bold')
      .text('Total Commission:', 350, y)
      .text(`€${Number(totalCommission || 0).toFixed(2)}`, 460, y);

    doc
      .fontSize(9)
      .fillColor('#8B7355')
      .font('Helvetica')
      .text('Morocco With You · team@moroccowithyou.com', 50, 750, {
        align: 'center',
        width: 495,
      });

    doc.end();
  });

