import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter;
  private readonly logger = new Logger(NotificationsService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify SMTP connection on startup so config errors are visible immediately
    this.transporter.verify((error: any, success: any) => {
      if (error) {
        this.logger.error('❌ SMTP connection FAILED. Emails will not be sent!', error);
      } else {
        this.logger.log(`✅ SMTP connected successfully as ${process.env.SMTP_USER}`);
      }
    });
  }

  private formatPhone(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('03')) {
      return '+92' + cleaned.substring(1);
    }
    if (cleaned.startsWith('92')) {
      return '+' + cleaned;
    }
    return '+' + cleaned;
  }

  private async sendWhatsApp(phone: string, body: string) {
    if (!phone) return;
    const formattedPhone = this.formatPhone(phone);
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    const baseUrl = process.env.ULTRAMSG_BASE_URL || 'https://api.ultramsg.com';
    
    if (!instanceId || !token) {
      this.logger.warn('UltraMsg credentials not configured. Skipping WhatsApp.');
      return;
    }

    const url = `${baseUrl}/${instanceId}/messages/chat`;
    const params = new URLSearchParams({
      token: token,
      to: formattedPhone,
      body: body,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      if (!response.ok) {
        this.logger.error(`UltraMsg API error: ${response.statusText}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp message: ${err.message}`);
    }
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (!to) {
      this.logger.warn('sendEmail called with empty "to" address — skipping.');
      return;
    }
    try {
      this.logger.log(`📧 Sending email to: ${to} | Subject: ${subject}`);
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"Airian's Cafe" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`✅ Email sent to ${to} | MessageId: ${info.messageId}`);
    } catch (err) {
      this.logger.error(`❌ Failed to send email to ${to}:`, err);
    }
  }

  private getEmailWrapper(contentHtml: string): string {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #040b1a 0%, #0b1d3a 100%); padding: 30px; text-align: center; border-bottom: 4px solid #f7b32b;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
            Airian's Cafe
          </h1>
          <p style="color: #f7b32b; margin: 5px 0 0 0; font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">
            Campus Ordering Desk ☕🍔
          </p>
        </div>
        
        <!-- Content Body -->
        <div style="padding: 30px; background-color: #ffffff;">
          ${contentHtml}
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; margin: 0; font-size: 12px; font-weight: bold;">
            🎓 Airian's Cafe • Located at the Student Hub
          </p>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 11px;">
            Fast, fresh campus orders. Skip the queue, order online!
          </p>
        </div>
      </div>
    `;
  }

  async sendOtp(name: string, email: string, phone: string, otp: string) {
    // 1. WhatsApp OTP Message
    const waBody = `🔐 *Airian's Cafe Verification Code*\n\nHey *${name}*! 👋 Ready to beat the campus hunger?\n\nYour One-Time Password is: *${otp}*\n\nUse this code to verify your account and start ordering delicious food! 🍔🍟☕`;
    await this.sendWhatsApp(phone, waBody);

    // 2. Email OTP HTML
    const emailContent = `
      <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 800;">Hey ${name}! 👋</h2>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">
        Welcome to the Airian's Cafe family! We are thrilled to help you skip the queue and enjoy the best burgers, pizzas, and hot Karak Chai on campus.
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">
        Before we can get cooking, let's secure your account. Please use the verification code below:
      </p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center;">
        <span style="display: block; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 1.5px; margin-bottom: 5px;">
          One-Time Password (OTP)
        </span>
        <h1 style="color: #0b1d3a; margin: 0; font-size: 38px; font-weight: 900; letter-spacing: 8px; font-family: monospace;">
          ${otp}
        </h1>
      </div>
      
      <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
        This code is valid for 10 minutes. If you did not create an account at Airian's Cafe, you can safely ignore this email.
      </p>
    `;
    
    await this.sendEmail(email, `🔐 ${otp} is your Airian's Cafe verification code`, this.getEmailWrapper(emailContent));
  }

  async sendOrderStatus(name: string, email: string, phone: string, orderDetails: any, status: 'placed' | 'ready' | 'picked_up') {
    let waBody = '';
    let emailSubject = '';
    let emailContent = '';
    const code = orderDetails.shortCode;

    const paymentLabel = orderDetails.paymentMethod === 'wallet' 
      ? 'Student Wallet 💳' 
      : orderDetails.paymentMethod === 'cash' 
        ? 'Cash at Counter 💵' 
        : 'JazzCash 📱';

    const pickupTimeFormatted = orderDetails.pickupAt 
      ? new Date(orderDetails.pickupAt).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) 
      : 'ASAP';

    if (status === 'placed') {
      // Confirmed WhatsApp
      waBody = `🎉 *Order Confirmed!* — *Airian's Cafe*\n\nHi *${name}*! The chef is firing up the kitchen. 👨‍🍳🔥\n\n🔑 *Pickup Code:* \`${code}\`\n🕒 *Estimated Time:* ${pickupTimeFormatted}\n💵 *Total Amount:* Rs. ${orderDetails.totalAmount}\n💳 *Payment:* ${paymentLabel}\n\nWe will ping you as soon as your food is packed and ready! 🚀`;
      
      emailSubject = `🎉 Order Confirmed! (Pickup Code: ${code}) - Airian's Cafe`;
      
      const itemsHtml = orderDetails.items && orderDetails.items.length
        ? orderDetails.items.map((item: any) => `
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #1e293b;">
                ${item.quantity}x ${item.name}
              </td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px; font-weight: bold; color: #0f172a;">
                Rs. ${item.lineTotal}
              </td>
            </tr>
          `).join('')
        : '';

      emailContent = `
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 800;">Order Confirmed! 👨‍🍳🔥</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Great news, <strong>${name}</strong>! Your order has been received and our kitchen crew is already preheating the grills.
        </p>
        
        <div style="margin: 25px 0; padding: 20px; background-color: #fffbeb; border: 2px solid #fef3c7; border-radius: 12px; text-align: center;">
          <span style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #b45309; letter-spacing: 1.5px;">
            Your Collection Code
          </span>
          <h1 style="color: #b45309; margin: 5px 0 0 0; font-size: 40px; font-weight: 900; letter-spacing: 2px; font-family: monospace;">
            ${code}
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #78350f; font-weight: 600;">
            📅 Estimated Pickup: ${pickupTimeFormatted}
          </p>
        </div>
        
        <h3 style="color: #0f172a; font-size: 16px; font-weight: 700; margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
          Order Summary
        </h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Item</th>
              <th style="padding: 10px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr style="border-top: 2px solid #e2e8f0;">
              <td style="padding: 15px 10px; font-size: 15px; font-weight: bold; color: #0f172a;">Total Amount</td>
              <td style="padding: 15px 10px; text-align: right; font-size: 18px; font-weight: 900; color: #f59e0b;">Rs. ${orderDetails.totalAmount}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 25px; padding: 15px; background-color: #f8fafc; border-radius: 8px; font-size: 14px; color: #475569; border: 1px solid #e2e8f0;">
          <strong>Payment Method:</strong> ${paymentLabel}<br/>
          ${orderDetails.notes ? `<strong>Special Notes:</strong> <span style="color: #d97706;">${orderDetails.notes}</span>` : ''}
        </div>
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-top: 25px;">
          We will send you another update the second your food is packed and ready. Hang tight!
        </p>
      `;

    } else if (status === 'ready') {
      // Ready WhatsApp
      waBody = `🛎️ *Ding! Your Order is READY!* — *Airian's Cafe*\n\nHi *${name}*, your food is hot, fresh, and waiting for you at the counter!\n\n🔑 *Pickup Code:* \`${code}\`\n\nHead over to the cafe counter, show your code, and grab your delicious meal! 🍕☕`;
      
      emailSubject = `🛎️ Ding! Your Order is READY! (Code: ${code}) - Airian's Cafe`;
      
      emailContent = `
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 800;">Fresh & Hot, Ready to Go! 🍔🍟</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Hey <strong>${name}</strong>! Your wait is over. Your food has just been plated, packed, and is sitting warm at the pickup desk.
        </p>
        
        <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f7b32b 0%, #f59e0b 100%); border-radius: 12px; text-align: center; color: #040b1a; box-shadow: 0 4px 15px rgba(245,158,11,0.25);">
          <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
            Show this code at counter
          </span>
          <h1 style="margin: 5px 0; font-size: 48px; font-weight: 950; letter-spacing: 3px; font-family: monospace;">
            ${code}
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 800; text-transform: uppercase;">
            🏃‍♂️ Grab it while it's fresh and steaming!
          </p>
        </div>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Head over to Airian's Cafe right now, present this collection code to our counter associate, and dig in! 😋
        </p>
      `;

    } else if (status === 'picked_up') {
      // Picked Up WhatsApp
      waBody = `😋 *Meal Picked Up!* — *Airian's Cafe*\n\nThank you for dining with us, *${name}*! We hope you loved your meal. ❤️🍔\n\n🌟 *How did we do?*\nDon't forget to rate your order on your orders history page! http://localhost:3000/orders\n\nSee you next time! 👋`;
      
      emailSubject = `😋 Hope you loved your Airian's Cafe meal!`;
      
      emailContent = `
        <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 800;">Thanks for dining with us! ❤️</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Hi <strong>${name}</strong>, your order was picked up successfully. We hope every bite was absolutely delicious!
        </p>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Whether you ordered a spicy Zinger, a fresh slice of pizza, or a cozy Karak Chai, we'd love to hear how we did!
        </p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="http://localhost:3000/orders" style="display: inline-block; padding: 14px 30px; font-size: 15px; font-weight: bold; color: #040b1a; background-color: #f7b32b; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(247,179,43,0.3); transition: transform 0.2s;">
            ⭐ Rate & Leave Feedback
          </a>
        </div>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Your ratings directly help our kitchen improve and make Airian's Cafe the best spot on campus.
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Have a great rest of your day, and see you next time you crave something tasty!
        </p>
      `;
    } else {
      return;
    }

    await this.sendWhatsApp(phone, waBody);
    await this.sendEmail(email, emailSubject, this.getEmailWrapper(emailContent));
  }
}
