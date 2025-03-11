require("dotenv").config();
const { Resend } = require("resend");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

const resend = new Resend(process.env.RESEND_API_KEY);

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// **User Registration Controller**
exports.signUpController = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      mobile,
      address,
      role,
    } = req.body;
    const file = req.file;

    // Check if email, username, or mobile already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { mobile }],
    });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure only one admin exists
    if (role === "admin") {
      const adminExists = await User.findOne({ role: "admin" });
      if (adminExists) {
        return res.status(400).json({ message: "An admin already exists" });
      }
    }

    let profileImage = null;

    if (file) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "user_profiles" },
        async (error, result) => {
          if (error)
            return res.status(500).json({ message: "Image upload failed" });

          profileImage = result.secure_url;

          // Create a new user with Cloudinary URL
          const newUser = new User({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            mobile,
            address,
            role,
            profileImage,
          });

          await newUser.save();
          res
            .status(201)
            .json({ message: "User registered successfully", profileImage });
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    } else {
      const newUser = new User({
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        mobile,
        address,
        role,
      });

      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// **User Login Controller**
exports.signInController = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({ message: "Email/Username and password are required" });
    }

    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY || "your_default_secret_key",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        role: user.role,
        profileImage: user.profileImage, // Return Cloudinary image URL
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.resetPasswordController = async (req, res) => {
  try {
    const { email, password, newPassword } = req.body;

    if (!email || !password || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare provided password with stored password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
