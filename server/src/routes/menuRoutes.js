import express from "express";
import { adminOnly, protect } from "../middleware/auth.js";
import { MenuItem } from "../models/MenuItem.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, search, available } = req.query;
    const query = { isActive: true };

    if (category && category !== "All") query.category = category;
    if (available === "true") query.isInStock = true;
    if (search) query.$text = { $search: search };

    const items = await MenuItem.find(query).sort({ category: 1, name: 1 });
    const categories = await MenuItem.distinct("category", { isActive: true });

    res.json({ items, categories: ["All", ...categories.sort()] });
  })
);

router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  })
);

router.patch(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    return res.json(item);
  })
);

router.patch(
  "/:id/toggle-stock",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    item.isInStock = typeof req.body.isInStock === "boolean" ? req.body.isInStock : !item.isInStock;
    await item.save();
    return res.json(item);
  })
);

export default router;
