// Set default date to current month and load metro lines
document.addEventListener('DOMContentLoaded', async () => {
    // Set default date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dateInput = document.getElementById('scheduleDate');
    dateInput.value = `${year}-${month}`;
    dateInput.min = `${year}-${month}`; // Prevent selecting past months

    // Fetch metro lines from API
    try {
        const response = await fetch('http://localhost:3000/api/metro-lines');
        if (!response.ok) {
            throw new Error('Failed to fetch metro lines');
        }
        
        const metroLines = await response.json();
        const metroLineSelect = document.getElementById('metroLine');
        
        // Clear existing options except the first one
        metroLineSelect.innerHTML = '<option value="">Select Metro Line</option>';
        
        // Add options for each metro line
        metroLines.forEach(line => {
            const option = document.createElement('option');
            option.value = line.line_id;
            option.textContent = line.line_name;
            metroLineSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading metro lines. Please try again later.');
    }
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
