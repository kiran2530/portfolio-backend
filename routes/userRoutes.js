require("dotenv").config();
const express = require("express");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

let otpStorage = {}; // In-memory storage for OTPs (use a database in production)

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service
  auth: {
    user: "kiran30.portfolio@gmail.com",
    pass: process.env.PASS,
  },
});

const router = express.Router();

// Add a User
router.post("/", async (req, res) => {
  const { name, email, otp } = req.body;

  const storedOtp = otpStorage[email];

  // Validate OTP
  if (
    !storedOtp ||
    storedOtp.otp !== parseInt(otp) ||
    Date.now() > storedOtp.expires
  ) {
    return res
      .status(400)
      .json({ status: false, message: "Invalid or expired OTP." });
  }

  // OTP verified; add user to database
  try {
    const existing = await User.findOne({ email: email });

    if (existing) {
      return res.status(201).json({
        status: false,
        message:
          "User allready Subscribe with this email ID!. Please use different email",
      });
    }
    const newUser = new User({ name, email });
    const savedUser = await newUser.save();

    // Clear OTP from storage
    delete otpStorage[email];

    res.status(201).json({
      status: true,
      savedUser,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to save user. Please try again!",
      error: error.message,
    });
  }
});

// Retrieve All Users
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ status: true, users });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const existing = await User.findOne({ email: email });

  if (existing) {
    return res.status(201).json({
      status: false,
      message:
        "User allready Subscribe with this email ID!. Please use different email",
    });
  }
  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999);

  // Save OTP with a short expiry (e.g., 5 minutes)
  otpStorage[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  // Send OTP via email
  try {
    await transporter.sendMail({
      from: '"Kiran Nikam" nikamkiran2530@gmail.com',
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });
    res.json({ status: true, message: "OTP sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Failed to send OTP." });
  }
});

module.exports = router;
