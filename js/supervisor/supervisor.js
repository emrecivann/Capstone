// Set default date to current month
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    document.getElementById('scheduleDate').value = `${year}-${month}`;
});

// Handle line selection form submission
const handleLineSelection = (event) => {
    event.preventDefault();
    
    const metroLine = document.getElementById('metroLine').value;
    const scheduleDate = document.getElementById('scheduleDate').value;

    // Store selected values in sessionStorage for use in other pages
    sessionStorage.setItem('selectedLine', metroLine);
    sessionStorage.setItem('selectedDate', scheduleDate);

    // Redirect to monthly overview page
    window.location.href = 'supervisor-monthly-overview.html';

    return false;
};

// Handle edit request
const handleEditRequest = (event) => {
    event.preventDefault();
    
    // TODO: Implement edit functionality or navigation
    alert('Edit functionality will be implemented in future versions.');
    
    return false;
};

function generateScheduleDirectly() {
    const vatmanTableBody = document.getElementById('vatmanTableBody');
    vatmanTableBody.innerHTML = '';

    // Example data
    const scheduleData = [
        { date: '2025-04-01', vatmanCount: 5 },
        { date: '2025-04-02', vatmanCount: 6 },
        { date: '2025-04-03', vatmanCount: 4 },
    ];

    scheduleData.forEach(entry => {
        const row = document.createElement('tr');
        const dateCell = document.createElement('td');
        const countCell = document.createElement('td');

        dateCell.textContent = entry.date;
        countCell.textContent = entry.vatmanCount;

        row.appendChild(dateCell);
        row.appendChild(countCell);
        vatmanTableBody.appendChild(row);
    });
}
