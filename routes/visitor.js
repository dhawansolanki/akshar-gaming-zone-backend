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
  game: String,
  table: Number,
  agreeToTerms: Boolean,
});

const Visitor = db.model("Visitor", visitorSchema);

router.post("/", async (req, res) => {
  try {
    const { visitors, agreeToTerms } = req.body;

    console.log("Received data:", req.body);

    // Iterate over each group of visitors
    for (const group of visitors) {
      // Iterate over each visitor in the group
      for (const visitor of group) {
        const {
          phoneNo,
          emailId,
          name,
          addressLine1,
          addressLine2,
          addressLine3,
          dob,
          anniversaryDate,
          game,
        } = visitor;

        const newVisitor = new Visitor({
          phoneNo,
          emailId,
          name,
          address: {
            line1: addressLine1,
            line2: addressLine2,
            line3: addressLine3,
          },
          dob,
          anniversaryDate,
          game,
        });

        await newVisitor.save();
      }
    }

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
