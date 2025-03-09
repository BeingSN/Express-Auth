require("dotenv").config();
const { Resend } = require("resend");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

const resend = new Resend(process.env.RESEND_API_KEY);

// User Registration Controller
exports.signUpController = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prevent multiple admins (Optional)
    if (role === "admin") {
      const adminExists = await User.findOne({ role: "admin" });
      if (adminExists) {
        return res.status(400).json({ message: "An admin already exists" });
      }
    }

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User Login Controller
exports.signInController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY || "your_default_secret_key",
      { expiresIn: "1d" }
    );

    // Find admin to notify
    const admin = await User.findOne({ role: "admin" });

    // Send email to admin if exists
    if (admin) {
      try {
        const response = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: admin.email,
          subject: "User Login Alert",
          text: `User ${user.email} has logged in.`,
        });

        console.log("✅ Email sent successfully:", response);
      } catch (error) {
        console.error("❌ Error sending email:", error);
      }
    } else {
      console.log("No admin found to send email.");
    }

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
