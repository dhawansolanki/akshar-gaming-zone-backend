const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const router = express.Router();
require('dotenv').config();
const jwt = require("jsonwebtoken");

mongoose.connect(
  "mongodb+srv://akshargamezone:akshargamezone@akshar-game-zone.dfhupqm.mongodb.net/akshargamezone?retryWrites=true&w=majority&appName=Akshar-Game-Zone",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "akshargamezone",
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("MongoDB connected successfully");
});

const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  phoneNo: { type: String, unique: true, required: true },
  emailId: { type: String, unique: true, required: true },
  addressLine1: String,
  addressLine2: String,
  addressLine3: String,
  dob: Date,
  anniversaryDate: Date,
  password: String,
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
  next();
});

const User = mongoose.model("User", userSchema);

router.post("/signup", async (req, res) => {
  try {
    const {
      userId,
      name,
      phoneNo,
      emailId,
      addressLine1,
      addressLine2,
      addressLine3,
      dob,
      anniversaryDate,
      password,
    } = req.body;

    const newUser = new User({
      userId,
      name,
      phoneNo,
      emailId,
      addressLine1,
      addressLine2,
      addressLine3,
      dob,
      anniversaryDate,
      password,
    });

    await newUser.save();

    res.sendStatus(200);
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({ error: "Phone number or email already exists" });
    }
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
    const { identifier, password } = req.body;
  
    try {
      // Check if user exists with email or phone number
      const user = await User.findOne({
        $or: [{ emailId: identifier }, { phoneNo: identifier }],
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };
  
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
module.exports = router;
