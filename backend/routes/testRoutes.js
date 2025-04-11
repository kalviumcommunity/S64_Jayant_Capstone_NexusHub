const express = require("express");
const { createTest } = require("../controllers/testController");
const { getTestMessage } = require("../controllers/testController");

const router = express.Router();

router.get("/", getTestMessage);
router.post("/create", createTest);

module.exports = router;
