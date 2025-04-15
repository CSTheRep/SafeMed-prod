const express = require("express");
const { neon } = require("@neondatabase/serverless");
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

const sql = neon(`${process.env.DATABASE_URL}`);

app.post("/submit-form", async (req, res) => {
    try {
        const { 
            patient_initials, 
            gender, 
            age, 
            reason, 
            advised_by, 
            side_effect_description, 
            medicine_count, 
            start_date,
            stop_date,
            severity,
            medicines
        } = req.body;
        
        // Convert advised_by to match enum values
        const advisedByMap = {
            'Doctor': 'doctor',
            'Pharmacist': 'pharmacist',
            'Friends/Relatives': 'friends',
            'Self': 'self'
        };
        
        const advisedByValue = advisedByMap[advised_by] || 'doctor';

        // Convert severity to match enum values
        const severityValue = severity === 'Others' ? 'Others' : severity;

        // Insert report into the database
        const reportResult = await sql`
            INSERT INTO reports (
                patient_initials, 
                gender, 
                age, 
                reason, 
                advised_by, 
                side_effect_description, 
                medicine_count, 
                start_date,
                stop_date,
                severity,
                file_paths
            ) VALUES (
                ${patient_initials}, 
                ${gender}, 
                ${parseInt(age)}, 
                ${reason}, 
                ${advisedByValue}, 
                ${side_effect_description}, 
                ${parseInt(medicine_count)}, 
                ${start_date},
                ${stop_date},
                ${severityValue}, 
                '{}'::text[]
            ) RETURNING id;
        `;

        const report_id = reportResult[0].id;

        // Insert medicines
        const parsedMedicines = JSON.parse(medicines || "[]");
        if (parsedMedicines.length > 0) {
            for (const med of parsedMedicines) {
                await sql`
                    INSERT INTO medicines (report_id, medicine_name, dosage)
                    VALUES (${report_id}, ${med.name}, ${med.dosage});
                `;
            }
        }

        res.json({ 
            success: true, 
            message: "Report submitted successfully!",
            reportId: report_id
        });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ 
            success: false, 
            error: "Failed to submit report. Please try again.",
            details: error.message 
        });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));