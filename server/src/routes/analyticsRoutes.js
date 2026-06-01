import express from "express";
import { adminOnly, protect } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toDateOnly } from "../utils/time.js";

const router = express.Router();

router.get(
  "/waves",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { from = toDateOnly(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), to = toDateOnly() } = req.query;

    const data = await Order.aggregate([
      {
        $match: {
          orderType: "wave",
          waveDate: { $gte: from, $lte: to },
          status: { $ne: "cancelled" }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$wave",
          revenue: { $sum: "$items.lineTotal" },
          orderIds: { $addToSet: "$_id" },
          items: { $sum: "$items.quantity" }
        }
      },
      {
        $lookup: {
          from: "recesswaves",
          localField: "_id",
          foreignField: "_id",
          as: "wave"
        }
      },
      { $unwind: "$wave" },
      {
        $project: {
          _id: 0,
          waveId: "$wave._id",
          name: "$wave.name",
          revenue: 1,
          orders: { $size: "$orderIds" },
          items: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(data);
  })
);

export default router;
