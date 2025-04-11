const Test = require("../models/testModel");

// POST: Create a new Test item
const createTest = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const newTest = new Test({ title, description });
    const savedTest = await newTest.save();
    res.status(201).json(savedTest);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET: Test endpoint message
const getTestMessage = (req, res) => {
  res.json("NexusHub backend is live! 🚀");
};

// ✅ Export both functions together
module.exports = {
  createTest,
  getTestMessage,
};
