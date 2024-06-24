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

const visitorSchema = new mongoose.Schema({
  orderId: String,
  userId: String,
  phoneNo: String,
  emailId: String,
  name: String,
  addressLine1: String,
  addressLine2: String,
  addressLine3: String,
  dob: Date,
  anniversaryDate: Date,
  game: String,
  agreeToTerms: Boolean,
});

const Visitor = db.model("Visitor", visitorSchema);

router.post("/", async (req, res) => {
  try {
    const { visitors, agreeToTerms, orderId } = req.body;

    console.log("Received data:", req.body);

    const newVisitors = visitors.map((visitor) => ({
      ...visitor,
      orderId,
      agreeToTerms,
    }));

    await Visitor.insertMany(newVisitors);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const visitors = await Visitor.find({});
    res.status(200).json(visitors);
  } catch (error) {
    console.error("Error fetching visitors:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
