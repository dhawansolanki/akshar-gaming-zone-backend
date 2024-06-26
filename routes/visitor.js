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
  totalPrice: Number
});

const Visitor = db.model("Visitor", visitorSchema);

router.post("/", async (req, res) => {
  try {
    const { visitors, agreeToTerms, orderId, totalPrice } = req.body;

    console.log("Received data:", req.body);

    const newVisitors = visitors.map((visitor) => ({
      ...visitor,
      orderId,
      agreeToTerms,
      totalPrice
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

// Endpoint to fetch visitor details by phone number
router.get("/:phoneNo", async (req, res) => {
  const { phoneNo } = req.params;
  try {
    const visitor = await Visitor.findOne({ phoneNo });

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // Format DOB to yyyy-mm-dd
    const formattedDOB = formatDate(visitor.dob);
    
    // Format Anniversary Date to yyyy-mm-dd
    const formattedAnniversaryDate = formatDate(visitor.anniversaryDate);

    // Prepare visitor data to send to frontend
    const formattedVisitor = {
      ...visitor.toObject(),  // Convert Mongoose document to plain JavaScript object
      dob: formattedDOB,      // Replace original DOB with formatted DOB
      anniversaryDate: formattedAnniversaryDate  // Replace original anniversaryDate with formatted anniversaryDate
    };

    res.status(200).json(formattedVisitor);
  } catch (error) {
    console.error("Error fetching visitor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper function to format date to yyyy-mm-dd
function formatDate(date) {
  if (!date) return null;
  
  const year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
module.exports = router;
