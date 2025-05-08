// Set default date to current month
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    document.getElementById('scheduleDate').value = `${year}-${month}`;
});

// Handle schedule search
const handleScheduleSearch = (event) => {
    event.preventDefault();
    
    const metroLine = document.getElementById('metroLine').value;
    const scheduleDate = document.getElementById('scheduleDate').value;

    // Show the schedule container
    document.getElementById('scheduleContainer').style.display = 'block';

    // TODO: In the future, this will fetch real data from the backend
    // For now, display placeholder schedule data
    displayPlaceholderSchedule(metroLine, scheduleDate);

    return false;
};

// Display placeholder schedule data
const displayPlaceholderSchedule = (metroLine, scheduleDate) => {
    const [year, month] = scheduleDate.split('-');
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
            <th>Platform</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Add table body with placeholder data
    const tbody = document.createElement('tbody');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${year}-${month}-${String(day).padStart(2, '0')}</td>
            <td>Morning Shift</td>
            <td>06:00 - 14:00</td>
            <td>${metroLine} Platform 1</td>
        `;
        tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    
    // Clear previous content and add new table
    scheduleData.innerHTML = '';
    scheduleData.appendChild(table);
};
