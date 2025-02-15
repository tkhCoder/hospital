const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db_access = require('./Db.js');
const db = db_access.db;
const server = express();
const port = 555;

server.use(cors({
  origin: "http://localhost:3000",
  credentials: true, // Allow cookies to be sent
}));
server.use(express.json());

server.post('/user/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM USER WHERE EMAIL=?`, [email], (err, row) => {
    if (err || !row) {
      return res.status(401).send('Invalid credentials');
    }

    bcrypt.compare(password, row.PASSWORD, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).send('Invalid credentials');
      }

      const userID = row.ID;
      const isAdmin = row.ISADMIN;

      res.status(200).json({ id: userID, admin: isAdmin });
    });
  });
});

server.post('/user/register', (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).send('Error hashing password');
    }

    db.run(
      `INSERT INTO USER (name, email, password, isadmin) VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, isAdmin ? 1 : 0],
      (err) => {
        if (err) {
          return res.status(400).send('Error registering user');
        }
        res.status(200).send('User registered successfully');
      }
    );
  });
});

server.post('/doctor/add', (req, res) => {
  const { name, specialty, experience } = req.body;

  // Validate doctor data
  if (!name || !specialty || !experience || isNaN(experience)) {
    return res.status(400).send("Invalid doctor data provided");
  }

  // Insert doctor into the doctor table
  db.run(
    `INSERT INTO DOCTOR (name, specialty, years_of_experience) VALUES (?, ?, ?)`,
    [name, specialty, experience],
    function(err) {
      if (err) {
        console.error("❌ Error inserting doctor into DB:", err);
        return res.status(500).send("Error adding doctor");
      }

      const doctorId = this.lastID; // Get the inserted doctor's ID
      console.log("Doctor added with ID:", doctorId); // Log the inserted doctor's ID

      // Send back the doctor's ID to associate with operating hours
      res.status(200).json({ id: doctorId });
    }
  );
});

// Endpoint to add operating hours for a doctor
server.post('/operating_hours/add', (req, res) => {
  const { doctorId, day, startTime, endTime } = req.body;

  // Validate operating hours data
  if (!doctorId || !day || !startTime || !endTime) {
    return res.status(400).send("Missing required fields");
  }

  // Insert operating hours for the doctor
  db.run(
    `INSERT INTO OPERATING_HOURS (doctor_id, day, start_time, end_time) VALUES (?, ?, ?, ?)`,
    [doctorId, day, startTime, endTime],
    (err) => {
      if (err) {
        console.error(`❌ Error inserting operating hours for doctor ${doctorId} on day ${day}:`, err);
        return res.status(500).send("Error adding operating hours");
      }

      console.log(`✅ Operating hours for doctor ${doctorId} on day ${day} inserted successfully`);
      res.status(200).send("Operating hours added successfully");
    }
  );
});


// Add booking for a selected doctor and time slot with date validation
server.post('/bookings/add', (req, res) => {
  const { doctorId, day, timeSlot, userId, bookingDate } = req.body;

  // Validate the incoming data
  if (!doctorId || !day || !timeSlot || !userId || !bookingDate) {
      return res.status(400).send("Missing required fields");
  }

  // Check if the slot is already booked
  const checkQuery = `
      SELECT * FROM BOOKINGS 
      WHERE doctor_id = ? AND day = ? AND time_slot = ? AND booking_date = ? AND status = 'active'
  `;

  db.get(checkQuery, [doctorId, day, timeSlot, bookingDate], (err, row) => {
      if (err) {
          console.error("❌ Error checking booking:", err);
          return res.status(500).send("Failed to check existing booking");
      }

      if (row) {
          return res.status(409).send("Slot already booked");
      }

      // If slot is available, insert the booking
      const insertQuery = `
          INSERT INTO BOOKINGS (doctor_id, user_id, day, time_slot, booking_date) 
          VALUES (?, ?, ?, ?, ?)
      `;

      db.run(insertQuery, [doctorId, userId, day, timeSlot, bookingDate], (insertErr) => {
          if (insertErr) {
              console.error("❌ Error inserting booking:", insertErr);
              return res.status(500).send("Failed to create booking");
          }

          console.log(`✅ Booking created for doctor ID ${doctorId}, user ID ${userId}, on ${day} at ${timeSlot} for ${bookingDate}`);
          res.status(200).send("Booking successfully created");
      });
  });
});


// Get doctors with available slots
server.get('/doctors/available', (req, res) => {
  const query = `
      SELECT d.id AS doctor_id, d.name, d.specialty, d.years_of_experience, 
             oh.day, oh.start_time, oh.end_time,
             b.booking_date, b.time_slot AS booked_time
      FROM doctor d
      LEFT JOIN operating_hours oh ON d.id = oh.doctor_id
      LEFT JOIN bookings b ON d.id = b.doctor_id AND oh.day = b.day AND oh.start_time = b.time_slot
      ORDER BY d.id, oh.day, oh.start_time
  `;

  db.all(query, [], (err, rows) => {
      if (err) {
          console.error("❌ Error fetching doctors and slots:", err);
          return res.status(500).json({ error: "Failed to retrieve doctors and slots" });
      }

      const doctors = {};
      rows.forEach((row) => {
          if (!doctors[row.doctor_id]) {
              doctors[row.doctor_id] = {
                  id: row.doctor_id,
                  name: row.name,
                  specialty: row.specialty,
                  years_of_experience: row.years_of_experience,
                  slots: []
              };
          }

          // Mark slot as booked if a booking exists for the date
          const isBooked = row.booked_time ? true : false;

          doctors[row.doctor_id].slots.push({
              day: row.day,
              start: row.start_time,
              end: row.end_time,
              bookingDate: row.booking_date || null,
              isBooked
          });
      });

      res.json(Object.values(doctors));
  });
});

server.listen(port, () => {
  console.log(`Server started at port ${port}`);
});

