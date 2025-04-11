const express = require("express");
const { createTest, getTestMessage, updateTest } = require("../controllers/testController");

const router = express.Router();

router.get("/", getTestMessage);
router.post("/create", createTest);
router.put("/update/:id", updateTest);

module.exports = router;
