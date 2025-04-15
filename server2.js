require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uri = "mongodb+srv://asianbrian39:QClefSR56EHZpJ2e@cluster0.g9zax.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; 
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
connectDB();

const db = client.db("medicalReports");
const reportsCollection = db.collection("reports");

app.post("/submit-form", async (req, res) => {
  try {
    const {
      patientInitials,
      gender,
      age,
      reason,
      advisedBy,
      sideEffect,
      medicineCount,
      medicines,
      sideEffectStart,
      sideEffectStop,
      severity
    } = req.body;

    if (!patientInitials || !gender || !age || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const formData = {
      patientInitials,
      gender,
      age,
      reason,
      advisedBy,
      sideEffect,
      medicineCount: parseInt(medicineCount) || 0,
      medicines: Array.isArray(medicines) ? medicines : [],
      sideEffectStart,
      sideEffectStop,
      severity
    };

    await reportsCollection.insertOne(formData);
    res.status(200).json({ message: "Report submitted successfully!" });

  } catch (error) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

