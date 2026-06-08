import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { compareOtp, createOtpCode, hashOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { accountOtpMessage, sendWhatsAppMessage } from "../utils/whatsapp.js";
import { signToken } from "../utils/tokens.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/request-otp",
  asyncHandler(async (req, res) => {
    const { name, email, phone, role = "student" } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Name, email, and phone are required" });
    }

    const allowedRoles = ["student", "faculty", "staff", "guest"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing?.role === "admin") {
      return res.status(409).json({ message: "Use the admin login for this account" });
    }

    const code = createOtpCode();
    const codeHash = await hashOtp(code);

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          name,
          email: normalizedEmail,
          phone,
          role,
          otp: {
            codeHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
          }
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    await sendOtpEmail({ to: user.email, name: user.name, code });
    await sendWhatsAppMessage({ to: user.phone, body: accountOtpMessage(code) });

    return res.json({ message: "OTP sent to email and WhatsApp when configured" });
  })
);

router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const { email, code, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() });

    if (!user || !user.otp?.codeHash) {
      return res.status(400).json({ message: "Request a fresh OTP first" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Request a new code." });
    }

    const valid = await compareOtp(code, user.otp.codeHash);
    if (!valid) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    // Set password during first-time signup
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      await user.setPassword(password);
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    return res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email || "").toLowerCase(), role: { $ne: "admin" } });

    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your account with OTP first" });
    }

    return res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: String(email || "").toLowerCase(), role: { $ne: "admin" } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = createOtpCode();
    const codeHash = await hashOtp(code);

    user.otp = {
      codeHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();

    await sendOtpEmail({ to: user.email, name: user.name, code });

    return res.json({ message: "Password reset OTP sent to your email" });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, OTP code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: String(email || "").toLowerCase() });

    if (!user || !user.otp?.codeHash) {
      return res.status(400).json({ message: "Request password reset OTP first" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Request a new code." });
    }

    const valid = await compareOtp(code, user.otp.codeHash);
    if (!valid) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    await user.setPassword(newPassword);
    user.otp = undefined;
    await user.save();

    return res.json({ message: "Password reset successfully. Please login with your new password." });
  })
);

router.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase(), role: "admin" });

    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    return res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  })
);

router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    return res.json({ user: req.user });
  })
);

export default router;
