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

// User Registration Controller
exports.signUpController = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const file = req.file;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

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
            email,
            password: hashedPassword,
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
        email,
        password: hashedPassword,
        role,
      });

      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    }
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
        email: user.email,
        role: user.role,
        profileImage: user.profileImage, // Return Cloudinary image URL
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
