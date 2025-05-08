// Set default date to current month and handle authentication
document.addEventListener('DOMContentLoaded', () => {
    // Check if worker is logged in
    const workerId = sessionStorage.getItem('workerId');
    const metroLine = sessionStorage.getItem('metroLine');
    
    if (!workerId) {
        // If no worker ID in session, redirect to login
        window.location.href = '../../views/auth/index.html';
        return;
    }

    // Set the metro line field to the worker's line and make it readonly
    const metroLineInput = document.getElementById('metroLine');
    metroLineInput.value = metroLine;
    metroLineInput.readOnly = true;

    // Set default date to current month
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    document.getElementById('scheduleDate').value = `${year}-${month}`;
});

// Handle schedule search
const handleScheduleSearch = async (event) => {
    event.preventDefault();
    
    const workerId = sessionStorage.getItem('workerId');
    const scheduleDate = document.getElementById('scheduleDate').value;
    const [year, month] = scheduleDate.split('-');

    try {
        // Show loading state
        const scheduleContainer = document.getElementById('scheduleContainer');
        const scheduleData = document.getElementById('scheduleData');
        scheduleContainer.style.display = 'block';
        scheduleData.innerHTML = '<p>Loading schedule...</p>';

        // Fetch shifts from API
        const response = await fetch(`http://localhost:3000/api/shifts?workerId=${workerId}&month=${month}&year=${year}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch schedule');
        }

        const shifts = await response.json();
        displayWorkerSchedule(shifts, scheduleDate);
    } catch (error) {
        console.error('Error:', error);
        const scheduleData = document.getElementById('scheduleData');
        scheduleData.innerHTML = '<p style="color: red;">Error loading schedule. Please try again.</p>';
    }

    return false;
};

// Display worker's schedule
const displayWorkerSchedule = (shifts, scheduleDate) => {
    const scheduleData = document.getElementById('scheduleData');
    
    // Create table
    const table = document.createElement('table');
    table.className = 'table';
    
    // Add table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Shift</th>
            <th>Hours</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Add table body with the worker's schedule
    const tbody = document.createElement('tbody');
    
    // Map shift types to hours
    const shiftHours = {
        'MORNING': '06:00 - 14:00',
        'NIGHT': '14:00 - 22:00'
    };
    
    shifts.forEach(shift => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${shift.shift_date}</td>
            <td>${shift.shift_type}</td>
            <td>${shiftHours[shift.shift_type]}</td>
        `;
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Clear previous content and add new table
    scheduleData.innerHTML = '';
    scheduleData.appendChild(table);

    // If no shifts found, show message
    if (shifts.length === 0) {
        scheduleData.innerHTML = '<p>No shifts scheduled for this month.</p>';
    }
};

// Handle logout
const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '../../views/auth/index.html';
};
