const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const router = express.Router();
require("dotenv").config();
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
  password: String,
  addressLine1: String,
  addressLine2: String,
  addressLine3: String,
  dob: Date,
  anniversaryDate: Date,
  idProof: String,
  idNumber: String,
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
      password,
      addressLine1,
      addressLine2,
      addressLine3,
      dob,
      anniversaryDate,
      idProof,
      idNumber,
    } = req.body;

    const newUser = new User({
      userId,
      name,
      phoneNo,
      emailId,
      password,
      addressLine1,
      addressLine2,
      addressLine3,
      dob,
      anniversaryDate,
      idProof,
      idNumber,
    });

    await newUser.save();

    res.sendStatus(200);
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res
        .status(400)
        .json({ error: "Phone number or email already exists" });
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
    const userId = user.userId;
    const payload = {
      user: {
        id: userId,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (err, token) => {
        if (err) throw err;
        res.json({ userId, identifier, token });
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Endpoint to fetch user details by phone number
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const user = await User.findOne({ userId});
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Format DOB to dd/mm/yyyy
      const formattedDOB = user.dob.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
  
      // Format Anniversary Date to dd/mm/yyyy
      const formattedAnniversaryDate = user.anniversaryDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
  
      // Prepare user data to send to frontend
      const formattedUser = {
        ...user.toObject(),  // Convert Mongoose document to plain JavaScript object
        dob: formattedDOB,      // Replace original DOB with formatted DOB
        anniversaryDate: formattedAnniversaryDate  // Replace original anniversaryDate with formatted anniversaryDate
      };
  
      res.status(200).json(formattedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
module.exports = router;
