// backend/controllers/userController.js
const User = require("../models/userModel");

const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.status(201).json({ message: "User created", user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createUser };
