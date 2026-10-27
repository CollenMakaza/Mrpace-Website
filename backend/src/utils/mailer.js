const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const OUTBOX = path.join(__dirname, "..", "..", "outbox");

let transporter = null;
function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

// Sends an email. When SMTP is not configured (e.g. during development) the
// email is written to backend/outbox/ so you can open it in a browser.
async function sendMail({ to, subject, html, attachments = [] }) {
  const t = getTransporter();
  if (!t) {
    if (!fs.existsSync(OUTBOX)) fs.mkdirSync(OUTBOX, { recursive: true });
    let preview = html;
    for (const a of attachments) {
      if (a.cid && a.content) {
        const b64 = Buffer.from(a.content).toString("base64");
        preview = preview.split(`cid:${a.cid}`).join(`data:image/png;base64,${b64}`);
      }
    }
    const file = path.join(OUTBOX, `${Date.now()}-${to.replace(/[^a-z0-9@.]/gi, "_")}.html`);
    fs.writeFileSync(file, `<!-- To: ${to} | Subject: ${subject} -->\n${preview}`);
    console.log(`[mail] SMTP not configured - saved email for ${to} to ${file}`);
    return { saved: file };
  }
  return t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html, attachments });
}

module.exports = { sendMail };
