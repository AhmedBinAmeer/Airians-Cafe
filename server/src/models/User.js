import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    codeHash: String,
    expiresAt: Date
  },
  { _id: false }
);

const walletTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["deposit", "payment", "refund"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true
    },
    phone: {
      type: String,
      trim: true,
      required: true
    },
    role: {
      type: String,
      enum: ["student", "faculty", "staff", "guest", "admin"],
      default: "student"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    passwordHash: String,
    walletBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    walletTransactions: [walletTransactionSchema],
    otp: otpSchema
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.checkPassword = function checkPassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model("User", userSchema);
