// Set default date to current month and handle authentication
document.addEventListener('DOMContentLoaded', async () => {
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

    // Fetch available months for the worker
    try {
        const response = await fetch(`http://localhost:3000/api/worker/available-months?workerId=${workerId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch available months');
        }

        const months = await response.json();
        const scheduleDateSelect = document.getElementById('scheduleDate');
        
        // Clear existing options except the first one
        scheduleDateSelect.innerHTML = '<option value="">Select a month</option>';
        
        // Add options for each available month
        months.forEach(({ year, month }) => {
            const monthStr = String(month).padStart(2, '0');
            const monthDate = new Date(year, month - 1, 1);
            const monthName = monthDate.toLocaleString('default', { month: 'long' });
            const option = document.createElement('option');
            option.value = `${year}-${monthStr}`;
            option.textContent = `${monthName} ${year}`;
            scheduleDateSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading available months. Please try again later.');
    }
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
        'NIGHT': '14:00 - 22:00',
        'OFF': '-'
    };
    
    shifts.forEach(shift => {
        const row = document.createElement('tr');
        // Format the date to show only YYYY-MM-DD
        const shiftDate = new Date(shift.shift_date);
        const formattedDate = shiftDate.toISOString().split('T')[0];
        
        row.innerHTML = `
            <td>${formattedDate}</td>
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
