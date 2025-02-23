const express = require("express");
const { neon } = require("@neondatabase/serverless");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const sql = neon(`${process.env.DATABASE_URL}`);

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post("/submit-form", upload.single('file-upload'), async (req, res) => {
    try {
        const { patient_initials, gender, age, reason, advised_by, side_effect_description, medicine_count, start_date, stop_date, severity } = req.body;
        const file = req.file;
        const medicines = JSON.parse(req.body.medicines || "[]");

        if (!medicines.length) {
            return res.status(400).json({ success: false, message: "At least one medicine is required." });
        }

        // Insert report into the database
        const reportResult = await sql`
            INSERT INTO reports (patient_initials, gender, age, reason, advised_by, side_effect_description, medicine_count, start_date, stop_date, severity, file_path)
            VALUES (${patient_initials}, ${gender}, ${age}, ${reason}, ${advised_by}, ${side_effect_description}, ${medicine_count}, ${start_date}, ${stop_date}, ${severity}, ${file ? file.path : null})
            RETURNING id;
        `;

        const report_id = reportResult[0].id;

        // Insert medicines into the database
        for (const med of medicines) {
            if (!med.name || !med.dosage) continue; // Ensure medicine has valid values
            
            await sql`
                INSERT INTO medicines (report_id, medicine_name, dosage)
                VALUES (${report_id}, ${med.name}, ${med.dosage});
            `;
        }

        res.json({ success: true, message: "Data saved successfully!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
