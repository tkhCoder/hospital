const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./Db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;

// User Registration
app.post('/register', (req, res) => {
    const { name, email, password, isAdmin } = req.body;
    db.run(`INSERT INTO USER (NAME, EMAIL, PASSWORD, ISADMIN) VALUES (?, ?, ?, ?)`,
        [name, email, password, isAdmin || 0],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'User registered successfully' });
        }
    );
});

// Get list of doctors
app.get('/doctors', (req, res) => {
    db.all(`SELECT * FROM DOCTOR`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Book an appointment
app.post('/appointments', (req, res) => {
    const { userId, doctorId, appointmentDate } = req.body;
    db.run(`INSERT INTO APPOINTMENT (USER_ID, DOCTOR_ID, APPOINTMENT_DATE) VALUES (?, ?, ?)`,
        [userId, doctorId, appointmentDate],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Appointment booked successfully' });
        }
    );
});

// Get appointments for a user
app.get('/appointments/:userId', (req, res) => {
    const { userId } = req.params;
    db.all(`SELECT * FROM APPOINTMENT WHERE USER_ID = ?`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
