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
  date: String,
  game: String,
  startTime: String,
  endTime: String,
  agreeToTerms: Boolean,
  totalPrice: Number,
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
      totalPrice,
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
      ...visitor.toObject(), // Convert Mongoose document to plain JavaScript object
      dob: formattedDOB, // Replace original DOB with formatted DOB
      anniversaryDate: formattedAnniversaryDate, // Replace original anniversaryDate with formatted anniversaryDate
    };

    res.status(200).json(formattedVisitor);
  } catch (error) {
    console.error("Error fetching visitor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/payment/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const visitor = await Visitor.findOne({ orderId: orderId });
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }
    res.status(200).json(visitor);
  } catch (error) {
    console.error("Error fetching visitor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper function to format date to yyyy-mm-dd
function formatDate(date) {
  if (!date) return null;

  const year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, "0");
  let day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

router.post("/check-availability", async (req, res) => {
  const { game, startTime } = req.body;

  try {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDateTime = new Date();
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const gameOptions = [
      { name: "Air Hockey", duration: 15 },
      { name: "Box Cricket", duration: 20 },
      { name: "Carrom", duration: 60 },
      { name: "Chess", duration: 60 },
      { name: "Ludo", duration: 60 },
      { name: "Pool", duration: 60 },
      { name: "Snakes & Ladders", duration: 60 },
      { name: "Table Tennis", duration: 60 },
    ];

    // Find the game option by name
    const gameOption = gameOptions.find((option) => option.name === game);

    if (!gameOption) {
      return res.status(400).json({ error: "Invalid game selected" });
    }

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(startDateTime.getMinutes() + gameOption.duration);

    // Format startDateTime and endDateTime to hh:mm
    const formattedStartTime = formatTime(startDateTime);
    const formattedEndTime = formatTime(endDateTime);

    // Check for overlapping bookings
    const overlappingBooking = await Visitor.findOne({
      game,
      // startTime: { $lt: endDateTime },
      startTime: { $lt: formattedEndTime },
      // endTime: { $gt: startDateTime },
      endTime: { $gt: formattedStartTime },
    });
    if (overlappingBooking) {
      return res.status(409).json({ error: "Time slot not available" });
    }

    res
      .status(200)
      .json({
        message: "Time slot available",
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Helper function to format date to hh:mm
function formatTime(dateTime) {
  const hours = dateTime.getHours().toString().padStart(2, "0");
  const minutes = dateTime.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

router.get("/available-slots/:game", async (req, res) => {
  const { game } = req.params;

  try {
    const gameOption = gameOptions.find((option) => option.name === game);

    if (!gameOption) {
      return res.status(400).json({ error: "Invalid game selected" });
    }

    const allBookings = await Visitor.find({ game }).sort({ startTime: 1 });

    const availableSlots = [];
    const openingTime = new Date();
    openingTime.setHours(10, 0, 0, 0); // Assuming opening time is 10:00 AM

    const closingTime = new Date(openingTime);
    closingTime.setHours(22, 0, 0, 0); // Assuming closing time is 10:00 PM

    let lastEndTime = openingTime;

    allBookings.forEach((booking) => {
      if (booking.startTime > lastEndTime) {
        const slotStartTime = new Date(lastEndTime);
        const slotEndTime = new Date(booking.startTime);

        availableSlots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
        });

        lastEndTime = new Date(booking.endTime);
      } else {
        lastEndTime = new Date(
          Math.max(lastEndTime.getTime(), booking.endTime.getTime())
        );
      }
    });

    if (lastEndTime < closingTime) {
      availableSlots.push({
        startTime: lastEndTime,
        endTime: closingTime,
      });
    }

    res.status(200).json(availableSlots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
