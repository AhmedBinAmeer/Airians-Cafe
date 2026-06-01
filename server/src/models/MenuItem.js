import mongoose from "mongoose";

const extraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    prepMinutes: {
      type: Number,
      default: 12,
      min: 1
    },
    tags: [String],
    extras: [extraSchema],
    imageUrl: String,
    isActive: {
      type: Boolean,
      default: true
    },
    isInStock: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

menuItemSchema.index({ name: "text", description: "text", category: "text", tags: "text" });

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
