import mongoose from "mongoose";

const orderExtraSchema = new mongoose.Schema(
  {
    name: String,
    price: Number
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    category: String,
    basePrice: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    extras: [orderExtraSchema],
    lineTotal: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    customerName: String,
    customerPhone: String,
    orderType: {
      type: String,
      enum: ["standard", "wave"],
      required: true
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ["wallet", "cash"],
      default: "cash"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },
    status: {
      type: String,
      enum: ["placed", "preparing", "ready", "picked_up", "cancelled"],
      default: "placed"
    },
    pickupAt: Date,
    standardSlot: Date,
    wave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecessWave"
    },
    waveDate: String,
    shortCode: {
      type: String,
      required: true,
      index: true
    },
    pickedUpAt: Date
  },
  { timestamps: true }
);

orderSchema.index({ orderType: 1, standardSlot: 1, status: 1 });
orderSchema.index({ orderType: 1, wave: 1, waveDate: 1, status: 1 });
orderSchema.index({ shortCode: 1, status: 1, createdAt: 1 });

export const Order = mongoose.model("Order", orderSchema);
