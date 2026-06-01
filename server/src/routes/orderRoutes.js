import express from "express";
import mongoose from "mongoose";
import { adminOnly, protect } from "../middleware/auth.js";
import { MenuItem } from "../models/MenuItem.js";
import { Order } from "../models/Order.js";
import { RecessWave } from "../models/RecessWave.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";
import { combineDateAndTime, endOfDay, normalizeSlot, startOfDay, toDateOnly } from "../utils/time.js";
import { orderConfirmationMessage, sendWhatsAppMessage } from "../utils/whatsapp.js";
import { sendOrderConfirmationEmail } from "../utils/mailer.js";

const router = express.Router();

async function generateShortCode() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await Order.exists({
      shortCode: code,
      status: { $in: ["placed", "preparing", "ready"] },
      createdAt: { $gte: startOfDay(), $lte: endOfDay() }
    });
    if (!existing) return code;
  }
  throw new Error("Unable to generate pickup code. Please try again.");
}

function selectedExtraNames(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const {
      items = [],
      orderType,
      pickupAt,
      waveId,
      waveDate = toDateOnly(),
      paymentMethod = "cash"
    } = req.body;

    if (!["standard", "wave"].includes(orderType)) {
      return res.status(400).json({ message: "Choose standard pickup or recess wave" });
    }

    if (!items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!["wallet", "cash"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Choose wallet or cash payment" });
    }

    const ids = items.map((item) => item.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: ids }, isActive: true });
    const menuById = new Map(menuItems.map((item) => [item._id.toString(), item]));

    const orderItems = items.map((cartItem) => {
      const menuItem = menuById.get(String(cartItem.menuItem));
      if (!menuItem) {
        throw httpError("A menu item in your cart is no longer available");
      }
      if (!menuItem.isInStock) {
        throw httpError(`${menuItem.name} is currently out of stock`, 409);
      }

      const quantity = Math.max(1, Number(cartItem.quantity || 1));
      const extraNames = selectedExtraNames(cartItem.extras);
      const extras = menuItem.extras.filter((extra) => extraNames.includes(extra.name));
      const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
      const lineTotal = (menuItem.price + extrasTotal) * quantity;

      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        category: menuItem.category,
        basePrice: menuItem.price,
        quantity,
        extras,
        lineTotal
      };
    });

    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const orderData = {
      customer: req.user._id,
      customerName: req.user.name,
      customerPhone: req.user.phone,
      orderType,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "wallet" ? "paid" : "pending",
      shortCode: await generateShortCode()
    };

    if (orderType === "standard") {
      const slot = normalizeSlot(pickupAt);
      if (!slot || slot < new Date(Date.now() + 10 * 60 * 1000)) {
        return res.status(400).json({ message: "Choose a valid pickup time at least 10 minutes from now" });
      }

      const cap = Number(process.env.MAX_STANDARD_ORDERS_PER_SLOT || 12);
      const used = await Order.countDocuments({
        orderType: "standard",
        standardSlot: slot,
        status: { $ne: "cancelled" }
      });

      if (used >= cap) {
        return res.status(409).json({ message: "This 15-minute slot is full. Please choose another time." });
      }

      orderData.pickupAt = new Date(pickupAt);
      orderData.standardSlot = slot;
    }

    if (orderType === "wave") {
      const wave = await RecessWave.findById(waveId);
      if (!wave || !wave.active) {
        return res.status(400).json({ message: "Selected recess wave is unavailable" });
      }

      const cutoff = combineDateAndTime(waveDate, wave.cutoffTime);
      if (new Date() > cutoff) {
        return res.status(409).json({ message: `${wave.name} orders closed at ${wave.cutoffTime}` });
      }

      const existing = await Order.aggregate([
        {
          $match: {
            orderType: "wave",
            wave: new mongoose.Types.ObjectId(waveId),
            waveDate,
            status: { $ne: "cancelled" }
          }
        },
        { $unwind: "$items" },
        { $group: { _id: null, total: { $sum: "$items.quantity" } } }
      ]);

      const usedItems = existing[0]?.total || 0;
      if (usedItems + totalItems > wave.maxItems) {
        return res.status(409).json({
          message: `${wave.name} has only ${Math.max(0, wave.maxItems - usedItems)} item capacity left`
        });
      }

      orderData.wave = wave._id;
      orderData.waveDate = waveDate;
      orderData.pickupAt = combineDateAndTime(waveDate, wave.startTime);
    }

    let order;

    if (paymentMethod === "wallet") {
      const paidUser = await User.findOneAndUpdate(
        { _id: req.user._id, walletBalance: { $gte: totalAmount } },
        {
          $inc: { walletBalance: -totalAmount },
          $push: {
            walletTransactions: {
              type: "payment",
              amount: totalAmount,
              note: `Order payment with code ${orderData.shortCode}`
            }
          }
        },
        { new: true }
      );

      if (!paidUser) {
        throw httpError("Wallet balance is too low", 400);
      }
    }

    try {
      order = await Order.create(orderData);
    } catch (error) {
      if (paymentMethod === "wallet") {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { walletBalance: totalAmount },
          $push: {
            walletTransactions: {
              type: "refund",
              amount: totalAmount,
              note: `Automatic refund for failed order ${orderData.shortCode}`
            }
          }
        });
      }
      throw error;
    }

    await sendWhatsAppMessage({
      to: req.user.phone,
      body: orderConfirmationMessage(order)
    });

    // Send order confirmation email
    const wave = order.wave ? await RecessWave.findById(order.wave) : null;
    const orderWithWave = { ...order.toObject(), wave };
    await sendOrderConfirmationEmail({
      to: req.user.email,
      name: req.user.name,
      order: orderWithWave,
      items: order.items.map(item => ({
        name: item.name,
        price: item.basePrice,
        quantity: item.quantity,
        extras: item.extras.map(e => e.name)
      }))
    });

    return res.status(201).json(order);
  })
);

router.get(
  "/mine",
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ customer: req.user._id })
      .populate("wave")
      .sort({ createdAt: -1 })
      .limit(25);
    res.json(orders);
  })
);

router.get(
  "/admin",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { view = "timeline", date = toDateOnly(), waveId } = req.query;
    const dayStart = combineDateAndTime(date, "00:00");
    const dayEnd = combineDateAndTime(date, "23:59");

    if (view === "batch") {
      const match = {
        orderType: "wave",
        waveDate: date,
        status: { $ne: "cancelled" }
      };
      if (waveId) match.wave = new mongoose.Types.ObjectId(waveId);

      const summary = await Order.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $group: {
            _id: {
              wave: "$wave",
              name: "$items.name",
              extras: "$items.extras.name"
            },
            quantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.lineTotal" }
          }
        },
        {
          $lookup: {
            from: "recesswaves",
            localField: "_id.wave",
            foreignField: "_id",
            as: "wave"
          }
        },
        { $unwind: "$wave" },
        { $sort: { "wave.startTime": 1, "_id.name": 1 } }
      ]);

      const orders = await Order.find(match).populate("wave customer", "name email phone startTime endTime").sort({ createdAt: 1 });
      return res.json({ summary, orders });
    }

    const orders = await Order.find({
      orderType: "standard",
      pickupAt: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: "cancelled" }
    })
      .populate("customer", "name email phone campusId")
      .sort({ pickupAt: 1 });

    return res.json({ orders });
  })
);

router.post(
  "/quick-fulfill",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const code = String(req.body.code || "").trim();
    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({ message: "Enter a valid 4-digit code" });
    }

    const order = await Order.findOne({
      shortCode: code,
      status: { $in: ["placed", "preparing", "ready"] }
    }).sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({ message: "No active order found for this code" });
    }

    order.status = "picked_up";
    order.pickedUpAt = new Date();
    await order.save();

    res.json(order);
  })
);

router.patch(
  "/:id/status",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const allowed = ["placed", "preparing", "ready", "picked_up", "cancelled"];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = req.body.status;
    if (req.body.status === "picked_up") order.pickedUpAt = new Date();
    await order.save();
    res.json(order);
  })
);

export default router;
