const sqlite = require('sqlite3');
const db = new sqlite.Database('hospital.db');

// Table for users
const createUserTable = `
CREATE TABLE IF NOT EXISTS USER (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    EMAIL TEXT UNIQUE NOT NULL,
    PASSWORD TEXT NOT NULL,
    ISADMIN INT
)`;

// Table for doctors
const createDoctorTable = `
CREATE TABLE IF NOT EXISTS DOCTOR (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    SPECIALTY TEXT NOT NULL,
    YEARS_OF_EXPERIENCE INTEGER NOT NULL
)`;

// Table for operating hours
const createOperatingHoursTable = `
CREATE TABLE IF NOT EXISTS OPERATING_HOURS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    DOCTOR_ID INTEGER NOT NULL,
    DAY TEXT NOT NULL,
    START_TIME TEXT NOT NULL,
    END_TIME TEXT NOT NULL,
    FOREIGN KEY (DOCTOR_ID) REFERENCES DOCTOR(ID)
)`;

// Table for bookings
const createBookingTable = `
CREATE TABLE IF NOT EXISTS BOOKING (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    DOCTOR_ID INTEGER NOT NULL,
    DAY TEXT NOT NULL,
    TIME_SLOT TEXT NOT NULL,
    BOOKING_DATE TEXT NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (DOCTOR_ID) REFERENCES DOCTOR(ID)
)`;

module.exports = {
    db,
    createUserTable,
    createDoctorTable,
    createOperatingHoursTable,
    createBookingTable
};
