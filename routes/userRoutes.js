const express = require("express");
const multer = require("multer");

const {
  signUpController,
  signInController,
  resetPasswordController,
} = require("../controller/userController");

const router = express.Router();

// Multer Storage Setup (Store in memory for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/signup", upload.single("profileImage"), signUpController);
router.post("/login", signInController);
router.post("/reset-password", resetPasswordController);

module.exports = router;
