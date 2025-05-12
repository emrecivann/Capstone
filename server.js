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

// API endpoint to get all metro lines
app.get('/api/metro-lines', async (req, res) => {
    try {
        const result = await pool.query('SELECT line_id, line_name FROM metro_lines ORDER BY line_id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching metro lines:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get daily worker counts for a metro line
app.get('/api/worker-counts', async (req, res) => {
    try {
        const { line_id, year, month } = req.query;
        
        // Validate required parameters
        if (!line_id || !year || !month) {
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

        console.log('Debug - Date range:', { startDate, endDate, line_id });

        // Query to get worker counts for each day
        const query = `
            WITH RECURSIVE dates AS (
                SELECT DATE($1) as date
                UNION ALL
                SELECT date + 1
                FROM dates
                WHERE date < DATE($2)
            )
            SELECT 
                d.date::date as date,
                COALESCE(COUNT(DISTINCT CASE WHEN s.shift_type != 'OFF' THEN s.worker_id END), 0) as worker_count
            FROM dates d
            LEFT JOIN shifts s ON d.date = s.shift_date
            LEFT JOIN workers w ON s.worker_id = w.worker_id AND w.metro_line_id = $3
            GROUP BY d.date
            ORDER BY d.date;
        `;

        const result = await pool.query(query, [startDate, endDate, line_id]);
        console.log('Debug - Query result:', result.rows);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching worker counts:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// API endpoint to get weekly schedule for a metro line
app.get('/api/schedule/line/:lineId', async (req, res) => {
    try {
        const { lineId } = req.params;
        const { startDate, endDate } = req.query;

        if (!lineId || !startDate || !endDate) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Fetch all active workers for the line
        const workersResult = await pool.query(
            `SELECT worker_id, full_name FROM workers WHERE metro_line_id = $1 AND is_active = true ORDER BY worker_id`,
            [lineId]
        );
        const workers = workersResult.rows;

        if (workers.length === 0) {
            return res.json([]);
        }

        // Fetch all shifts for these workers in the date range
        const workerIds = workers.map(w => w.worker_id);
        const shiftsResult = await pool.query(
            `SELECT worker_id, shift_date, shift_type FROM shifts 
             WHERE worker_id = ANY($1) AND shift_date >= $2 AND shift_date <= $3
             ORDER BY worker_id, shift_date`,
            [workerIds, startDate, endDate]
        );
        const shifts = shiftsResult.rows;

        // Map shifts to workers
        const workerMap = {};
        workers.forEach(w => {
            workerMap[w.worker_id] = { worker_id: w.worker_id, full_name: w.full_name, shifts: [] };
        });
        shifts.forEach(s => {
            workerMap[s.worker_id].shifts.push({ date: s.shift_date, shift_type: s.shift_type });
        });

        // Return as array
        res.json(Object.values(workerMap));
    } catch (error) {
        console.error('Error fetching weekly schedule:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 