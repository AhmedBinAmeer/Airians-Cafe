import axios from "axios";

function hasUltraMsgConfig() {
  return Boolean(process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN);
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export async function sendWhatsAppMessage({ to, body }) {
  if (!to || !body) return { skipped: true };

  if (!hasUltraMsgConfig()) {
    console.log(`[DEV WHATSAPP] ${to}: ${body}`);
    return { skipped: true };
  }

  const baseUrl = process.env.ULTRAMSG_BASE_URL || "https://api.ultramsg.com";
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  try {
    return await axios.post(`${baseUrl}/${instanceId}/messages/chat`, null, {
      params: {
        token,
        to: normalizePhone(to),
        body
      }
    });
  } catch (error) {
    console.warn("UltraMsg delivery failed:", error.response?.data || error.message);
    return { failed: true };
  }
}

export function accountOtpMessage(code) {
  return `
🔐 *Airian's Cafe Verification Code*

Your verification code is: *${code}*

⏱️ This code expires in 10 minutes

⚠️ Never share this code with anyone!

Welcome to our campus cafe 🍛
  `.trim();
}

export function orderConfirmationMessage(order) {
  return `
✅ *Order Confirmed!*

Pickup Code: *#${order.shortCode}*

💰 Total: PKR ${order.totalAmount.toLocaleString('en-PK')}
💳 Payment: ${order.paymentMethod === 'wallet' ? 'Wallet' : 'Cash'}

⏱️ Show this code at the counter for pickup

🍛 Airian's Cafe
Thank you for your order!
  `.trim();
}
