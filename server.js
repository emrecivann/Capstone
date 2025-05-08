const express = require('express');
const cors = require('cors');
const pool = require('./db/config');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from root directory

// Helper function to get the last day of a month
function getLastDayOfMonth(year, month) {
    // month is 1-based, so we pass month directly to get the first day of next month
    return new Date(year, month, 0).getDate();
}

// API endpoint to get available months for a worker
app.get('/api/worker/available-months', async (req, res) => {
    try {
        const { workerId } = req.query;
        
        if (!workerId) {
            return res.status(400).json({ error: 'Worker ID is required' });
        }

        const result = await pool.query(
            `SELECT DISTINCT 
                EXTRACT(YEAR FROM shift_date) as year,
                EXTRACT(MONTH FROM shift_date) as month
             FROM shifts 
             WHERE worker_id = $1 
             ORDER BY year, month`,
            [workerId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching available months:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// API endpoint to get shifts for a specific worker
app.get('/api/shifts', async (req, res) => {
    try {
        const { workerId, month, year } = req.query;
        
        // Validate required parameters
        if (!workerId || !month || !year) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Validate month and year format
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12 || isNaN(yearNum)) {
            return res.status(400).json({ error: 'Invalid month or year format' });
        }

        // Create date range for the specified month
        const startDate = `${yearNum}-${month.padStart(2, '0')}-01`;
        const lastDay = getLastDayOfMonth(yearNum, monthNum);
        const endDate = `${yearNum}-${month.padStart(2, '0')}-${lastDay}`;

        // Debug logging
        console.log('Date calculations:', {
            yearNum,
            monthNum,
            lastDay,
            startDate,
            endDate
        });

        const result = await pool.query(
            `SELECT shift_date, shift_type 
             FROM shifts 
             WHERE worker_id = $1 
             AND shift_date >= $2 
             AND shift_date <= $3 
             ORDER BY shift_date`,
            [workerId, startDate, endDate]
        );

        // Log the query details for debugging
        console.log('Query params:', { workerId, startDate, endDate });
        console.log('Found rows:', result.rows.length);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 