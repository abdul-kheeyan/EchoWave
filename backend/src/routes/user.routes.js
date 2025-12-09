import { Router } from "express";
import { login, register, addToHistory, getUserHistory } from "../controlers/user.controller.js";

const router = Router();

// User login and registration routes
router.post("/login", login);
router.post("/register", register);

// ✅ Add history route
router.post("/add-history", addToHistory);

// ✅ Get user history
// adminRoute.js
router.get('/get-history', async (req, res) => {
  try {
    const userId = req.session.userId; // ya jo session use kar rahe ho
    const history = await Meeting.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});


// Example placeholders for other routes (add actual controller functions later)
router.post("/add_to_activity", (req, res) => {
  res.send("Activity added successfully");
});

router.get("/get_all_activity", (req, res) => {
  res.send("All activities fetched successfully");
});

export default router;

