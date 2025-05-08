const express = require('express');
const cors = require('cors');
const pool = require('./db/config');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from root directory

// API endpoint to get shifts for a specific worker
app.get('/api/shifts', async (req, res) => {
    try {
        const { workerId, month, year } = req.query;
        
        // Validate required parameters
        if (!workerId || !month || !year) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Create date range for the specified month
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`; // This will work even for months with less days

        const result = await pool.query(
            `SELECT shift_date, shift_type 
             FROM shifts 
             WHERE worker_id = $1 
             AND shift_date >= $2 
             AND shift_date <= $3 
             ORDER BY shift_date`,
            [workerId, startDate, endDate]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 