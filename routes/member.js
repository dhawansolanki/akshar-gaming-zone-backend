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
  userId: String,
  parentId: String,
  phoneNo: String,
  emailId: String,
  name: String,
});

const Member = db.model("Member", memberSchema);

router.post("/", async (req, res) => {
  try {
    const { members, agreeToTerms, orderId } = req.body;

    console.log("Received data:", req.body);

    const newMembers = members.map((member, index) => ({
      ...member,
      orderId,
      agreeToTerms,
      parentId: index === 0 ? null : members[0].userId,
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

// Endpoint to fetch member details by phone number
router.get("/:phoneNo", async (req, res) => {
  const { phoneNo } = req.params;
  try {
    const member = await Member.findOne({ phoneNo });

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Format DOB to dd/mm/yyyy
    const formattedDOB = member.dob.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Format Anniversary Date to dd/mm/yyyy
    const formattedAnniversaryDate = member.anniversaryDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Prepare member data to send to frontend
    const formattedMember = {
      ...member.toObject(),  // Convert Mongoose document to plain JavaScript object
      dob: formattedDOB,      // Replace original DOB with formatted DOB
      anniversaryDate: formattedAnniversaryDate  // Replace original anniversaryDate with formatted anniversaryDate
    };

    res.status(200).json(formattedMember);
  } catch (error) {
    console.error("Error fetching member:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/group", async (req, res) => {
  try {
    const {parentId} = req.body;
    const children = await Member.find({ parentId});
    res.json(children);
  } catch (error) {
    console.error("Error fetching children:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
