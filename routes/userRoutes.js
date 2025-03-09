const express = require("express");

const {
  signUpController, // Corrected casing
  signInController,
} = require("../controller/userController");

const router = express.Router();

router.post("/signup", signUpController);

// Login Route
router.post("/login", signInController);

module.exports = router;
