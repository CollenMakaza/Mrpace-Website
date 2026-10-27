const router = require("express").Router();
const db = require("../db");
const paynow = require("../utils/paynow");
const { refreshPaynow } = require("./registrations");

router.get("/config", (req, res) => {
  res.json({
    paynowEnabled: paynow.enabled(),
    currency: "USD",
    manual: {
      ecocash: process.env.MANUAL_PAY_ECOCASH || "",
      bank: process.env.MANUAL_PAY_BANK || "",
    },
  });
});

// Paynow calls this URL when a payment status changes. We never trust the
// posted body: we re-check the status with Paynow using our stored poll URL.
router.post("/paynow/result", async (req, res) => {
  const reference = req.body.reference;
  const reg = reference && db.find("registrations", (r) => r.payment && r.payment.merchantReference === reference);
  if (reg) await refreshPaynow(reg);
  res.sendStatus(200);
});

module.exports = router;
