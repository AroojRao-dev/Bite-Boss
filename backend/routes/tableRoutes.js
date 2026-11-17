import express from "express";
import { safeUpload } from "../middleware/multer.js";
import {
  addTable,
  getAllTables,
  deleteTable,
  getTablesWithStatus,
  getTableBookings,
  getSingleTableDetails,
  updateTable,
} from "../controllers/tableController.js";

const router = express.Router();

// safeUpload — multer error ko catch karke JSON response deta hai
// upload.single ki jagah yeh use karo taake server crash na ho
router.post("/add", safeUpload("image"), addTable);

router.get("/all", getAllTables);
router.put("/update/:id", updateTable);
router.delete("/delete/:id", deleteTable);
router.get("/status", getTablesWithStatus);
router.get("/bookings", getTableBookings);
router.get("/:tableNumber", getSingleTableDetails);

export default router;