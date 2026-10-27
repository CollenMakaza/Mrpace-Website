// Wrapper around the official Paynow Zimbabwe SDK (EcoCash, OneMoney, cards).
const { Paynow } = require("paynow");

function client() {
  const id = process.env.PAYNOW_INTEGRATION_ID;
  const key = process.env.PAYNOW_INTEGRATION_KEY;
  if (!id || !key) return null;
  const paynow = new Paynow(id, key);
  const api = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
  paynow.resultUrl = `${api}/api/payments/paynow/result`;
  paynow.returnUrl = `${(process.env.CLIENT_URL || "http://localhost:5173").split(",")[0]}/my-races`;
  return paynow;
}

const enabled = () => Boolean(client());

// method: "ecocash" | "onemoney" (USSD prompt on the phone) or "web" (redirect)
async function startPayment({ reference, email, description, amount, method, phone }) {
  const paynow = client();
  if (!paynow) throw new Error("Online payments are not configured.");
  const payment = paynow.createPayment(reference, email);
  payment.add(description, Number(amount));

  const response = method === "web" ? await paynow.send(payment) : await paynow.sendMobile(payment, phone, method);

  if (!response || !response.success) {
    throw new Error((response && response.error) || "Paynow could not start the payment.");
  }
  return {
    pollUrl: response.pollUrl,
    redirectUrl: response.redirectUrl || null,
    instructions: response.instructions || null,
  };
}

async function checkPayment(pollUrl) {
  const paynow = client();
  if (!paynow || !pollUrl) return { paid: false, status: "unknown" };
  const status = await paynow.pollTransaction(pollUrl);
  const paid = typeof status.paid === "function" ? status.paid() : /paid|awaiting delivery|delivered/i.test(status.status || "");
  return { paid, status: status.status, paynowReference: status.paynowReference || status.paynowreference };
}

module.exports = { enabled, startPayment, checkPayment };
