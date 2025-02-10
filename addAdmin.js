document.addEventListener('DOMContentLoaded', () => {
    fetchDoctors();

    document.getElementById('login-form').addEventListener('submit', function (event) {
        event.preventDefault();
        loginUser();
    });

    document.getElementById('register-form').addEventListener('submit', function (event) {
        event.preventDefault();
        registerUser();
    });

    document.getElementById('appointment-form').addEventListener('submit', function (event) {
        event.preventDefault();
        bookAppointment();
    });
});

// User Login
function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Login successful');
            document.getElementById('app-content').style.display = 'block';
        } else {
            alert('Invalid email or password');
        }
    })
    .catch(error => console.error('Error logging in:', error));
}

// Fetch list of doctors
function fetchDoctors() {
    fetch('http://localhost:3000/doctors')
        .then(response => response.json())
        .then(doctors => {
            const doctorList = document.getElementById('doctor-list');
            doctorList.innerHTML = '';
            doctors.forEach(doctor => {
                const li = document.createElement('li');
                li.textContent = `${doctor.ID} - ${doctor.NAME} (Specialty: ${doctor.SPECIALTY})`;
                doctorList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching doctors:', error));
}

// Register a new user
function registerUser() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error('Error registering user:', error));
}

// Book an appointment
function bookAppointment() {
    const userId = document.getElementById('user-id').value;
    const doctorId = document.getElementById('doctor-id').value;
    const appointmentDate = document.getElementById('appointment-date').value;
    
    fetch('http://localhost:3000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, doctorId, appointmentDate })
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error('Error booking appointment:', error));
}

// Fetch user appointments
function fetchAppointments() {
    const userId = document.getElementById('user-id-view').value;
    
    fetch(`http://localhost:3000/appointments/${userId}`)
        .then(response => response.json())
        .then(appointments => {
            const appointmentList = document.getElementById('appointment-list');
            appointmentList.innerHTML = '';
            appointments.forEach(appointment => {
                const li = document.createElement('li');
                li.textContent = `Appointment with Doctor ID: ${appointment.DOCTOR_ID} on ${appointment.APPOINTMENT_DATE} (Status: ${appointment.STATUS})`;
                appointmentList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching appointments:', error));
}
