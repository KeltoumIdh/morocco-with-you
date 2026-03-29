import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'noreply@moroccowithyou.com';
const TEAM = process.env.EMAIL_TEAM || 'team@moroccowithyou.com';

const send = async ({ to, subject, html, text }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('[EMAIL] Skipped (no RESEND_API_KEY):', subject, '→', to);
    return { skipped: true };
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html, text });
    console.log('[EMAIL] Sent:', subject, '→', to);
    return result;
  } catch (err) {
    console.error('[EMAIL] Failed:', err.message);
    throw err;
  }
};

export const sendBookingConfirmation = async ({
  toEmail,
  toName,
  bookingRef,
  experienceTitle,
  travelDate,
  guests,
  totalAmount,
}) =>
  send({
    to: toEmail,
    subject: `Booking Confirmed — ${experienceTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#2C1F12;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#D4A853;margin:0;font-size:24px">Morocco With You</h1>
        </div>
        <div style="padding:32px;background:#FAF6EE;border-radius:0 0 12px 12px">
          <h2 style="color:#1A1410">Booking Confirmed ✓</h2>
          <p style="color:#8B7355">Hi ${toName || 'there'},</p>
          <p style="color:#8B7355">Your booking is confirmed. Here are the details:</p>
          <div style="background:#F2E8D8;border-radius:12px;padding:20px;margin:20px 0">
            <p><strong>Experience:</strong> ${experienceTitle}</p>
            <p><strong>Date:</strong> ${new Date(travelDate).toLocaleDateString('en', { dateStyle: 'full' })}</p>
            <p><strong>Guests:</strong> ${guests}</p>
            <p><strong>Total:</strong> €${totalAmount}</p>
            <p><strong>Reference:</strong> ${bookingRef}</p>
          </div>
          <p style="color:#8B7355">Need help? Reply to this email or contact us at ${TEAM}</p>
          <p style="color:#C0654A;font-weight:600">The Morocco With You Team</p>
        </div>
      </div>
    `,
    text: `Booking Confirmed — ${experienceTitle}\nDate: ${travelDate}\nGuests: ${guests}\nTotal: €${totalAmount}\nRef: ${bookingRef}`,
  });

export const sendPlanningRequestNotification = async ({
  fullName,
  email,
  phone,
  startDate,
  endDate,
  groupSize,
  groupType,
  cities,
  budget,
}) =>
  send({
    to: TEAM,
    subject: `New Planning Request — ${fullName} (${groupSize} pax)`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1A1410">New Planning Request</h2>
        <table style="width:100%;border-collapse:collapse">
          ${[
            ['Name', fullName],
            ['Email', email],
            ['Phone', phone || '—'],
            ['Dates', `${startDate} → ${endDate || '—'}`],
            ['Group', `${groupSize} ${groupType || ''}`],
            ['Cities', (cities || []).join(', ')],
            ['Budget', budget || '—'],
          ]
            .map(
              ([k, v]) => `
            <tr style="border-bottom:1px solid #E8C4A0">
              <td style="padding:8px;font-weight:600;color:#8B7355;width:120px">${k}</td>
              <td style="padding:8px;color:#1A1410">${v}</td>
            </tr>
          `
            )
            .join('')}
        </table>
        <p style="margin-top:20px">
          <a href="${(process.env.ADMIN_URL || 'http://localhost:5174').replace(/\/$/, '')}/admin/planning"
            style="background:#C0654A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">
            View in Admin →
          </a>
        </p>
      </div>
    `,
    text: `New Planning Request from ${fullName} (${email}) — ${groupSize} pax, ${startDate}→${endDate || '—'}`,
  });

/** Client approved the sent itinerary — notify ops team */
export const sendPlanningItineraryValidatedToTeam = async ({
  requestId,
  fullName,
  email,
}) =>
  send({
    to: TEAM,
    subject: `Itinerary validated — ${fullName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2 style="color:#1A1410">Planning request validated</h2>
        <p style="color:#8B7355">${fullName} (${email}) has approved the proposed itinerary.</p>
        <p style="margin-top:16px">
          <a href="${(process.env.ADMIN_URL || 'http://localhost:5174').replace(/\/$/, '')}/admin/planning"
            style="background:#C0654A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">
            Open in Admin →
          </a>
        </p>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px">Request ID: ${requestId}</p>
      </div>
    `,
    text: `Itinerary validated by ${fullName} (${email}). Request: ${requestId}`,
  });

export const sendGroupTripConfirmation = async ({
  toEmail,
  toName,
  tripTitle,
  startDate,
  guests,
  totalAmount,
  bookingRef,
}) =>
  send({
    to: toEmail,
    subject: `You're in — ${tripTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#2C1F12;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#D4A853;margin:0">Morocco With You</h1>
        </div>
        <div style="padding:32px;background:#FAF6EE;border-radius:0 0 12px 12px">
          <h2 style="color:#1A1410">You're joining the group!</h2>
          <p>Hi ${toName || 'there'}, your spot on <strong>${tripTitle}</strong> is confirmed.</p>
          <div style="background:#F2E8D8;border-radius:12px;padding:20px;margin:20px 0">
            <p><strong>Trip:</strong> ${tripTitle}</p>
            <p><strong>Departure:</strong> ${new Date(startDate).toLocaleDateString('en', { dateStyle: 'full' })}</p>
            <p><strong>Guests:</strong> ${guests}</p>
            <p><strong>Total:</strong> €${totalAmount}</p>
            <p><strong>Ref:</strong> ${bookingRef}</p>
          </div>
          <p style="color:#C0654A;font-weight:600">The Morocco With You Team</p>
        </div>
      </div>
    `,
    text: `You're joining ${tripTitle} — ${startDate}. Ref: ${bookingRef}`,
  });

export const sendEventRequestNotification = async ({
  fullName,
  email,
  eventType,
  eventDate,
  groupSize,
  budget,
  message,
}) =>
  send({
    to: TEAM,
    subject: `Event Request — ${eventType} (${fullName})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
        <h2>New Event Request</h2>
        <p><strong>Type:</strong> ${eventType}</p>
        <p><strong>From:</strong> ${fullName} (${email})</p>
        <p><strong>Date:</strong> ${eventDate || '—'}</p>
        <p><strong>Group size:</strong> ${groupSize || '—'}</p>
        <p><strong>Budget:</strong> ${budget || '—'}</p>
        <p><strong>Message:</strong> ${message || '—'}</p>
      </div>
    `,
    text: `Event Request: ${eventType} from ${fullName} (${email})`,
  });

export const sendCommissionReport = async ({
  toEmail,
  providerName,
  month,
  totalRevenue,
  totalCommission,
  pdfUrl,
}) =>
  send({
    to: toEmail,
    subject: `Commission Report — ${month}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <div style="background:#2C1F12;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#D4A853;margin:0">Morocco With You</h1>
        </div>
        <div style="padding:32px;background:#FAF6EE;border-radius:0 0 12px 12px">
          <h2>Commission Report — ${month}</h2>
          <p>Dear ${providerName || 'Partner'},</p>
          <p>Please find your commission report for ${month}:</p>
          <div style="background:#F2E8D8;border-radius:12px;padding:20px;margin:20px 0">
            <p><strong>Total Revenue:</strong> €${Number(totalRevenue || 0).toFixed(2)}</p>
            <p style="color:#C0654A;font-size:18px;font-weight:700">
              <strong>Total Commission Due:</strong> €${Number(totalCommission || 0).toFixed(2)}
            </p>
          </div>
          <a href="${pdfUrl}"
            style="background:#C0654A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">
            Download Full Report PDF
          </a>
        </div>
      </div>
    `,
    text: `Commission ${month}: €${Number(totalCommission || 0).toFixed(2)} due. Download: ${pdfUrl}`,
  });

