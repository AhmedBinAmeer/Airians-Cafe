import express from "express";
import { protect } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/deposit",
  protect,
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount || 0);

    if (!Number.isFinite(amount) || amount < 50) {
      return res.status(400).json({ message: "Minimum wallet deposit is PKR 50" });
    }

    const user = await User.findById(req.user._id);
    user.walletBalance += amount;
    user.walletTransactions.push({
      type: "deposit",
      amount,
      note: "Mock student wallet deposit"
    });
    await user.save();

    res.json({
      walletBalance: user.walletBalance,
      walletTransactions: user.walletTransactions.slice(-10).reverse()
    });
  })
);

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("walletBalance walletTransactions");
    res.json({
      walletBalance: user.walletBalance,
      walletTransactions: user.walletTransactions.slice(-10).reverse()
    });
  })
);

export default router;
