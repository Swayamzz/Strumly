const express = require("express");
const router = express.Router();
const { generateLyrics } = require("../controllers/lyricsController");
const { protect } = require("../Middleware/auth");

router.post("/generate", protect, generateLyrics);

module.exports = router;
