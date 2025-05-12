// Helper to format date as YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Helper to get week range (start and end date) for a given date
function getWeekRange(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    // Set to previous Sunday (or today if Sunday)
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
}

function getUTCDateString(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// State
let currentStartDate = null;
let currentEndDate = null;

// On page load
window.addEventListener('DOMContentLoaded', async () => {
    const selectedLine = sessionStorage.getItem('selectedLine');
    if (!selectedLine) {
        window.location.href = 'supervisor-select-line.html';
        return;
    }
    document.getElementById('selectedLine').textContent = selectedLine;

    // Default to current week
    const today = new Date();
    const { start, end } = getWeekRange(today);
    currentStartDate = start;
    currentEndDate = end;
    await loadAndRenderSchedule();

    // Navigation buttons
    document.getElementById('prevWeekBtn').onclick = async () => {
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        currentEndDate.setDate(currentEndDate.getDate() - 7);
        await loadAndRenderSchedule();
    };
    document.getElementById('nextWeekBtn').onclick = async () => {
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        currentEndDate.setDate(currentEndDate.getDate() + 7);
        await loadAndRenderSchedule();
    };
});

async function loadAndRenderSchedule() {
    const selectedLine = sessionStorage.getItem('selectedLine');
    const weekRangeElem = document.getElementById('weekRange');
    const errorMessage = document.getElementById('errorMessage');
    weekRangeElem.textContent = `${formatDate(currentStartDate)} to ${formatDate(currentEndDate)}`;
    errorMessage.style.display = 'none';

    try {
        const url = `http://localhost:3000/api/schedule/line/${selectedLine}?startDate=${formatDate(currentStartDate)}&endDate=${formatDate(currentEndDate)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch schedule');
        const data = await response.json();
        renderScheduleTable(data);
    } catch (err) {
        errorMessage.textContent = 'Error loading schedule. Please try again.';
        errorMessage.style.display = 'block';
        renderScheduleTable([]);
    }
}

function renderScheduleTable(data) {
    const table = document.getElementById('scheduleTable');
    table.innerHTML = '';
    // Header row
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Worker</th>';
    for (let d = 0; d < 7; d++) {
        const date = new Date(currentStartDate);
        date.setDate(date.getDate() + d);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
        headerRow.innerHTML += `<th>${dateStr}</th>`;
    }
    table.appendChild(headerRow);
    // Data rows
    if (!data || data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" style="text-align:center;">No data available</td>`;
        table.appendChild(row);
        return;
    }
    data.forEach(worker => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${worker.full_name} - ${worker.worker_id}</td>`;
        for (let d = 0; d < 7; d++) {
            const date = formatDate(new Date(currentStartDate.getTime() + d * 24 * 60 * 60 * 1000));
            // Use UTC date string for comparison
            const shift = worker.shifts.find(s => getUTCDateString(s.date) === date);
            row.innerHTML += `<td>${shift ? shift.shift_type.charAt(0) + shift.shift_type.slice(1).toLowerCase() : ''}</td>`;
        }
        table.appendChild(row);
    });
} 