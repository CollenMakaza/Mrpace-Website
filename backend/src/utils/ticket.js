const QRCode = require("qrcode");
const { sendMail } = require("./mailer");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-ZW", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

async function sendTicketEmail({ registration, race, user }) {
  const qr = await QRCode.toBuffer(registration.ticketCode, { width: 320, margin: 1, color: { dark: "#111111", light: "#ffffff" } });

  const html = `<!doctype html>
<html><body style="margin:0;background:#f2f2f2;font-family:Arial,Helvetica,sans-serif;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#111;padding:24px;text-align:center">
          <div style="font-size:28px;font-weight:900;letter-spacing:2px;color:#fff">MR <span style="color:#e10600">PACE</span></div>
          <div style="color:#bbb;font-size:12px;letter-spacing:3px;margin-top:4px">ATHLETICS CLUB · CHITUNGWIZA</div>
        </td></tr>
        <tr><td style="background:#e10600;color:#fff;padding:14px 24px;font-weight:bold;font-size:18px;text-align:center">
          Your race ticket is confirmed ✔
        </td></tr>
        <tr><td style="padding:28px 24px">
          <p style="margin:0 0 16px">Hi ${esc(user.name)},</p>
          <p style="margin:0 0 20px">Your payment has been verified and your place is secured. Show this email (or the QR code) at the registration desk on race day.</p>
          <table width="100%" cellpadding="8" cellspacing="0" style="border:2px dashed #e10600;border-radius:12px">
            <tr><td style="color:#777;font-size:12px">RACE</td><td style="font-weight:bold">${esc(race.title)}</td></tr>
            <tr><td style="color:#777;font-size:12px">DATE</td><td>${esc(formatDate(race.date))}</td></tr>
            <tr><td style="color:#777;font-size:12px">VENUE</td><td>${esc(race.location)}</td></tr>
            <tr><td style="color:#777;font-size:12px">DISTANCE</td><td>${esc(registration.distance)}</td></tr>
            <tr><td style="color:#777;font-size:12px">BIB NO.</td><td style="font-size:22px;font-weight:900;color:#e10600">${esc(registration.bibNumber)}</td></tr>
            <tr><td style="color:#777;font-size:12px">TICKET</td><td style="font-family:monospace;font-size:16px">${esc(registration.ticketCode)}</td></tr>
          </table>
          <div style="text-align:center;margin:24px 0 8px">
            <img src="cid:ticketqr" width="200" height="200" alt="Ticket QR code" style="border:6px solid #111;border-radius:8px">
          </div>
          <p style="font-size:13px;color:#555;margin:16px 0 0">Arrive at least 45 minutes before the start. Bring a valid ID. See you at the start line!</p>
        </td></tr>
        <tr><td style="background:#111;color:#999;font-size:12px;text-align:center;padding:16px">
          Mr Pace Athletics Club · Unit K Ext, Chitungwiza, Harare, Zimbabwe
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return sendMail({
    to: user.email,
    subject: `🎟 Your Mr Pace ticket – ${race.title}`,
    html,
    attachments: [{ filename: "ticket-qr.png", content: qr, cid: "ticketqr" }],
  });
}

async function sendRejectionEmail({ registration, race, user }) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
    <h2 style="color:#e10600">Mr Pace – registration update</h2>
    <p>Hi ${esc(user.name)},</p>
    <p>We could not verify the payment for your registration to <b>${esc(race.title)}</b> (${esc(registration.distance)}).</p>
    ${registration.adminNote ? `<p><b>Reason:</b> ${esc(registration.adminNote)}</p>` : ""}
    <p>Please log in to your Mr Pace account to submit a valid payment, or reply to this email if you think this is a mistake.</p>
    <p>— Mr Pace Athletics Club</p></div>`;
  return sendMail({ to: user.email, subject: `Mr Pace – payment not verified (${race.title})`, html });
}

module.exports = { sendTicketEmail, sendRejectionEmail };
