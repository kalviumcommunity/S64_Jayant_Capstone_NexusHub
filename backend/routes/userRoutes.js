const express = require("express");
const router = express.Router();
const { createUser, loginUser } = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");  // Import the protect middleware

router.post("/users", createUser);    // Route for user signup
router.post("/login", loginUser);     // Route for user login

// Protected Route (example)
router.get("/profile", protect, (req, res) => {
  res.status(200).json({ message: "Welcome to your profile", user: req.user });
});

module.exports = router;
