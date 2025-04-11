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

// PUT: Update a Test item
const updateTest = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
  
      if (!title) return res.status(400).json({ message: "Title is required" });
  
      const updatedTest = await Test.findByIdAndUpdate(
        id,
        { title, description },
        { new: true } // returns the updated doc
      );
  
      if (!updatedTest) {
        return res.status(404).json({ message: "Test item not found" });
      }
  
      res.status(200).json(updatedTest);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };
  

  module.exports = { createTest, getTestMessage, updateTest };
