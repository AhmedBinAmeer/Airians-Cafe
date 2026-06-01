import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

const emailStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #f9fafb;
    border-radius: 8px;
  }
  .header {
    background: linear-gradient(135deg, #0b1736 0%, #1e3a8a 100%);
    color: white;
    padding: 32px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.5px;
  }
  .header p {
    margin: 8px 0 0 0;
    font-size: 14px;
    opacity: 0.9;
  }
  .content {
    background: white;
    padding: 32px;
    border-radius: 0 0 8px 8px;
  }
  .greeting {
    font-size: 16px;
    font-weight: 600;
    color: #0b1736;
    margin-bottom: 16px;
  }
  .otp-box {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    padding: 24px;
    border-radius: 8px;
    text-align: center;
    margin: 24px 0;
    border: 2px solid #f97316;
  }
  .otp-code {
    font-size: 42px;
    font-weight: 900;
    color: #1f2937;
    letter-spacing: 8px;
    font-family: 'Courier New', monospace;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .otp-label {
    color: #7c2d12;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    margin-top: 12px;
  }
  .order-details {
    background: #f0f9ff;
    border-left: 4px solid #0b1736;
    padding: 16px;
    margin: 20px 0;
    border-radius: 4px;
  }
  .order-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e5e7eb;
  }
  .order-item:last-child {
    border-bottom: none;
  }
  .item-name {
    font-weight: 600;
    color: #0b1736;
  }
  .item-qty {
    background: #dbeafe;
    color: #0b1736;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .item-price {
    font-weight: 700;
    color: #0b1736;
    min-width: 60px;
    text-align: right;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 16px 0;
    border-top: 2px solid #e5e7eb;
    margin-top: 12px;
    font-size: 18px;
    font-weight: 900;
    color: #0b1736;
  }
  .pickup-code {
    background: #0b1736;
    color: #fbbf24;
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    margin: 20px 0;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 2px;
    font-family: 'Courier New', monospace;
  }
  .info-box {
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    padding: 16px;
    margin: 16px 0;
    border-radius: 4px;
    font-size: 14px;
    color: #065f46;
  }
  .warning-box {
    background: #fef2f2;
    border-left: 4px solid #ef4444;
    padding: 16px;
    margin: 16px 0;
    border-radius: 4px;
    font-size: 14px;
    color: #7f1d1d;
  }
  .footer {
    background: #1f2937;
    color: white;
    text-align: center;
    padding: 24px;
    font-size: 12px;
    border-radius: 0 0 8px 8px;
  }
  .footer p {
    margin: 4px 0;
  }
  .btn {
    display: inline-block;
    background: #0b1736;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 16px;
  }
  .divider {
    height: 1px;
    background: #e5e7eb;
    margin: 24px 0;
  }
`;

export async function sendOtpEmail({ to, name, code }) {
  if (!hasSmtpConfig()) {
    console.log(`[DEV EMAIL OTP] ${to}: ${code}`);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "🔐 Your Airian's Cafe Verification Code",
    text: `Your Airian's Cafe verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nNever share this code with anyone!`,
    html: `
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body style="margin: 0; padding: 20px; background: #f9fafb;">
        <div class="container">
          <div class="header">
            <h1>🍛 Airian's Cafe</h1>
            <p>Campus Cafe Experience</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name || "there"},</div>
            
            <p>Welcome to Airian's Cafe! 🎉 We're excited to have you on board.</p>
            
            <p>To complete your account verification, please use the code below:</p>
            
            <div class="otp-box">
              <p class="otp-code">${code}</p>
              <p class="otp-label">⏱️ Expires in 10 minutes</p>
            </div>
            
            <div class="warning-box">
              <strong>Security Notice:</strong> Never share this code with anyone. We'll never ask for it via email or message.
            </div>
            
            <p><strong>What you can do:</strong></p>
            <ul style="color: #0b1736; line-height: 1.8;">
              <li>Browse our delicious menu</li>
              <li>Place orders for standard pickup or recess waves</li>
              <li>Manage your student wallet</li>
              <li>Track your orders in real-time</li>
            </ul>
            
            <div class="divider"></div>
            
            <p style="font-size: 12px; color: #6b7280;">
              <strong>Didn't request this code?</strong> You can safely ignore this email. Your account won't be created until you verify with this code.
            </p>
          </div>
          <div class="footer">
            <p><strong>Airian's Cafe</strong></p>
            <p>Serving great food to our campus community 🌟</p>
            <p>Questions? Contact us or visit the cafe</p>
          </div>
        </div>
      </body>
      </html>
    `
  });
}

export async function sendOrderConfirmationEmail({ to, name, order, items }) {
  if (!hasSmtpConfig()) {
    console.log(`[DEV ORDER CONFIRMATION] ${to}: Order ${order.shortCode}`);
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const itemsHtml = items.map((item) => `
    <div class="order-item">
      <div>
        <div class="item-name">${item.name}</div>
        <div style="font-size: 12px; color: #6b7280;">
          ${item.extras && item.extras.length > 0 ? `+ ${item.extras.join(', ')}` : ''}
        </div>
      </div>
      <div class="item-qty">${item.quantity}x</div>
      <div class="item-price">PKR ${(item.price * item.quantity).toLocaleString('en-PK')}</div>
    </div>
  `).join('');

  const pickupInfo = order.orderType === 'wave' 
    ? `<p><strong>Wave:</strong> ${order.wave?.name || 'Recess Wave'} on ${order.waveDate}</p>`
    : `<p><strong>Pickup Time:</strong> ${new Date(order.pickupAt).toLocaleString('en-PK')}</p>`;

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `✅ Order Confirmed - Code #${order.shortCode}`,
    text: `Order Confirmed!\n\nPickup Code: #${order.shortCode}\nTotal: PKR ${order.totalAmount.toLocaleString('en-PK')}\nPayment: ${order.paymentMethod === 'wallet' ? 'Wallet' : 'Cash'}\n\nShow this code at the counter to pick up your order.`,
    html: `
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${emailStyles}</style>
      </head>
      <body style="margin: 0; padding: 20px; background: #f9fafb;">
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
            <p>Your order is being prepared</p>
          </div>
          <div class="content">
            <div class="greeting">Hi ${name},</div>
            
            <p>Thank you for your order at Airian's Cafe! 🙏 Your order has been placed successfully and is being prepared.</p>
            
            <div class="pickup-code">#${order.shortCode}</div>
            
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              <strong>Show this code at the counter to pick up your order</strong>
            </p>
            
            <div class="info-box">
              <strong>📍 Pickup Details:</strong>
              ${pickupInfo}
              <p style="margin-top: 8px;">Payment: <strong>${order.paymentMethod === 'wallet' ? '💳 Wallet' : '💵 Cash'}</strong></p>
            </div>
            
            <h3 style="color: #0b1736; margin-top: 24px; margin-bottom: 12px;">📦 Your Order</h3>
            <div class="order-details">
              ${itemsHtml}
              <div class="total-row">
                <span>Total:</span>
                <span>PKR ${order.totalAmount.toLocaleString('en-PK')}</span>
              </div>
            </div>
            
            <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ⏱️ <strong>Estimated time:</strong> ${order.orderType === 'wave' ? '5-15 minutes' : 'As per scheduled time'}
              </p>
            </div>
            
            <div class="divider"></div>
            
            <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
              <strong>Need Help?</strong> You can view your order status anytime in the app. For urgent matters, contact us at the cafe counter.
            </p>
          </div>
          <div class="footer">
            <p><strong>Airian's Cafe</strong></p>
            <p>Great food, Great service 🌟</p>
            <p>Enjoy your meal!</p>
          </div>
        </div>
      </body>
      </html>
    `
  });
}
