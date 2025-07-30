const express = require("express");
const {
  registerUser,
  loginUser,
} = require("../../controllers/auth-controller/index");
const authenticateMiddleware = require("../../middlewares/auth-middleware");
const User = require("../../models/User");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/check-auth", authenticateMiddleware, (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    data: {
      user,
    },
  });
});

// New route to get user by ID (public)
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
