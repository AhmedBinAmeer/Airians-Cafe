import express from "express";
import { adminOnly, protect } from "../middleware/auth.js";
import { RecessWave } from "../models/RecessWave.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const waves = await RecessWave.find({ active: true }).sort({ startTime: 1 });
    res.json(waves);
  })
);

router.get(
  "/admin/all",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const waves = await RecessWave.find().sort({ startTime: 1 });
    res.json(waves);
  })
);

router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const wave = await RecessWave.create(req.body);
    res.status(201).json(wave);
  })
);

router.patch(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const wave = await RecessWave.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!wave) return res.status(404).json({ message: "Recess wave not found" });
    return res.json(wave);
  })
);

export default router;
