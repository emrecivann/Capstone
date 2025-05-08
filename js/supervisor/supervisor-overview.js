import { getDriversForLine, getRandomDrivers } from './driverData.js';

// Constants
const SHIFTS = ['Morning (6am-12pm)', 'Afternoon (12pm-6pm)', 'Night (6pm-12am)'];

// Initialize page when loaded
document.addEventListener('DOMContentLoaded', () => {
    const selectedLine = sessionStorage.getItem('selectedLine');
    const selectedDate = sessionStorage.getItem('selectedDate');

    if (selectedLine && selectedDate) {
        document.getElementById('selectedLine').textContent = selectedLine;
        const [year, month] = selectedDate.split('-');
        document.getElementById('selectedMonth').textContent = `${year}-${month}`;

        const vatmanTableBody = document.getElementById('vatmanTableBody');
        vatmanTableBody.innerHTML = '';

        const daysInMonth = new Date(year, month, 0).getDate();
        const exampleCounts = Array(daysInMonth).fill(10);

        const globalInput = document.getElementById('globalVatmanCount');
        globalInput.onchange = () => {
            const value = globalInput.value;
            if (value >= 10 && value <= 40) {
                const inputs = vatmanTableBody.getElementsByTagName('input');
                for (let input of inputs) {
                    input.value = value;
                }
            } else {
                alert('Vatman count must be between 10 and 40.');
            }
        };

        for (let day = 1; day <= daysInMonth; day++) {
            const row = document.createElement('tr');
            const dateCell = document.createElement('td');
            const countCell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = 10;
            input.max = 40;
            input.value = exampleCounts[day - 1];
            input.onchange = () => {
                if (input.value < 10 || input.value > 40) {
                    alert('Vatman count must be between 10 and 40.');
                    input.value = Math.max(10, Math.min(input.value, 40));
                }
            };

            const date = new Date(year, month - 1, day);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            dateCell.textContent = `${year}-${month.padStart(2, '0')}-${String(day).padStart(2, '0')} (${dayName})`;
            countCell.appendChild(input);

            row.appendChild(dateCell);
            row.appendChild(countCell);
            vatmanTableBody.appendChild(row);
        }
    } else {
        window.location.href = 'supervisor-select-line.html';
        return;
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
