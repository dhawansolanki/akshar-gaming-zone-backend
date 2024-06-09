const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const dbConnection = mongoose.createConnection(
  "mongodb+srv://akshargamezone:akshargamezone@akshar-game-zone.dfhupqm.mongodb.net/akshargamezone?retryWrites=true&w=majority&appName=Akshar-Game-Zone",
  {
    dbName: "akshargamezone",
  }
);

const db = dbConnection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const memberSchema = new mongoose.Schema({
  phoneNo: String,
  emailId: String,
  name: String,
  address: {
    line1: String,
    line2: String,
    line3: String,
  },
  dob: Date,
  anniversaryDate: Date,
  idProof: String,
  idNumber: String,
  game: String,
  table: Number,
  timeSlot: String,
  agreeToTerms: Boolean,
});

const Member = db.model("Member", memberSchema);

router.post("/", async (req, res) => {
  try {
    const { members, agreeToTerms } = req.body;

    console.log("Received data:", req.body);

    const newMembers = members.map((member) => ({
      ...member,
      agreeToTerms,
    }));

    await Member.insertMany(newMembers);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const members = await Member.find({});
    res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
