// Constants
const SHIFTS = ['Morning (6am-12pm)', 'Afternoon (12pm-6pm)', 'Night (6pm-12am)'];

// Initialize page when loaded
document.addEventListener('DOMContentLoaded', async () => {
    const selectedLine = sessionStorage.getItem('selectedLine');
    const selectedDate = sessionStorage.getItem('selectedDate');

    if (!selectedLine || !selectedDate) {
        window.location.href = 'supervisor-select-line.html';
        return;
    }

    // Display selected line and month
    document.getElementById('selectedLine').textContent = selectedLine;
    
    // Parse the date properly
    const [year, month] = selectedDate.split('-');
    document.getElementById('selectedMonth').textContent = `${year}-${month}`;

    console.log('Debug - Selected values:', {
        selectedLine,
        selectedDate,
        year,
        month
    });

    try {
        // Fetch worker counts from API
        const url = `http://localhost:3000/api/worker-counts?line_id=${selectedLine}&year=${year}&month=${month}`;
        console.log('Debug - API URL:', url);

        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`Failed to fetch worker counts: ${errorData.error || response.statusText}`);
        }
        
        const workerCounts = await response.json();
        console.log('Debug - Worker counts:', workerCounts);

        const tableBody = document.getElementById('workerTableBody');
        tableBody.innerHTML = '';

        if (workerCounts.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="2" style="text-align: center;">No data available for this month</td>';
            tableBody.appendChild(row);
            return;
        }

        // Create table rows for each day
        workerCounts.forEach(({ date, worker_count }) => {
            const row = document.createElement('tr');
            
            // Format the date to be more readable
            const formattedDate = new Date(date);
            const dayName = formattedDate.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedDateStr = formattedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            row.innerHTML = `
                <td class="date-cell">${formattedDateStr} (${dayName})</td>
                <td class="worker-count">${worker_count || 0}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = `Error loading worker counts: ${error.message}`;
        errorMessage.style.display = 'block';
    }

    // Add event listener for Generate Schedule button
    const generateScheduleBtn = document.getElementById('generateScheduleBtn');
    if (generateScheduleBtn) {
        generateScheduleBtn.addEventListener('click', () => {
            window.location.href = 'supervisor-weekly-schedule.html';
        });
    }
});

// Generate vatman count table
const generateVatmanTable = (dateStr) => {
    const [year, month] = dateStr.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const tbody = document.getElementById('vatmanTableBody');
    
    tbody.innerHTML = '';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const row = document.createElement('tr');
        const formattedDate = `${year}-${month}-${String(day).padStart(2, '0')}`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>
                <input type="number" 
                       class="form-control vatman-count" 
                       value="10" 
                       min="10" 
                       max="40">
            </td>
        `;
        
        tbody.appendChild(row);
    }
};

// Get a random shift
const getRandomShift = () => {
    const rand = Math.random();
    if (rand < 0.4) return 'Morning';
    else if (rand < 0.8) return 'Night';
    else return 'Afternoon';
}

// Generate the schedule
const generateSchedule = () => {
    const selectedLine = sessionStorage.getItem('selectedLine');
    const selectedDate = sessionStorage.getItem('selectedDate');
    const [year, month] = selectedDate.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();

    // Get all vatman counts
    const vatmanCounts = Array.from(document.querySelectorAll('.vatman-count'))
        .map((input, index) => ({
            date: `${year}-${month}-${String(index + 1).padStart(2, '0')}`,
            count: parseInt(input.value)
        }));

    // Validate all counts
    for (const { count } of vatmanCounts) {
        if (count < 10 || count > 40) {
            const errorMessage = document.getElementById('errorMessage');
            errorMessage.textContent = 'Please enter valid driver counts (10-40) for all dates';
            errorMessage.style.display = 'block';
            return;
        }
    }

    // Clear and show schedule section
    const scheduleSection = document.getElementById('scheduleSection');
    const tbody = document.getElementById('scheduleTableBody');
    scheduleSection.style.display = 'block';
    tbody.innerHTML = '';

    // Generate schedule for each day
    vatmanCounts.forEach(({ date, count }) => {
        const drivers = getRandomDrivers(selectedLine, count);
        
        drivers.forEach(driver => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>${driver.id} - ${driver.fullName}</td>
                <td>${getRandomShift()}</td>
            `;
            tbody.appendChild(row);
        });
    });

    // Hide error message if it was shown
    document.getElementById('errorMessage').style.display = 'none';
};

function generateScheduleDirectly() {
    const scheduleTable = document.getElementById('scheduleTable');
    scheduleTable.innerHTML = '';

    const vatmanTableBody = document.getElementById('vatmanTableBody');
    const rows = vatmanTableBody.getElementsByTagName('tr');

    const names = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis'];

    const calendar = document.createElement('div');
    calendar.className = 'calendar';

    for (let row of rows) {
        const date = row.cells[0].textContent;
        const count = row.cells[1].getElementsByTagName('input')[0].value;

        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        const dateHeader = document.createElement('h4');
        dateHeader.textContent = date;

        dayDiv.appendChild(dateHeader);

        for (let i = 0; i < count; i++) {
            const driverDiv = document.createElement('div');
            const name = names[i % names.length];
            const shift = getRandomShift();
            driverDiv.innerHTML = `<strong>${name}</strong> <span class="shift">(${shift})</span>`;
            dayDiv.appendChild(driverDiv);
        }

        calendar.appendChild(dayDiv);
    }

    scheduleTable.innerHTML = '';
    scheduleTable.appendChild(calendar);
    document.getElementById('scheduleSection').style.display = 'block';
}

function getRandomShiftHelper() {
    const rand = Math.random();
    if (rand < 0.4) return 'Morning';
    else if (rand < 0.8) return 'Evening';
    else return 'Afternoon';
}

// Make functions available to HTML
window.generateSchedule = generateSchedule;
window.generateScheduleDirectly = generateScheduleDirectly;
