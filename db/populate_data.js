const pool = require('./config');

// Distribute shift patterns evenly among workers
const getShiftPattern = (index) => {
    const patterns = ['4_2', '5_2', '6_1'];
    return patterns[index % patterns.length];
};

const metroDrivers = {
    M1: [
        { id: "M1D001", fullName: "Kemal Yıldırım" },
        { id: "M1D002", fullName: "Zeynep Aydın" },
        { id: "M1D003", fullName: "Mustafa Koç" },
        { id: "M1D004", fullName: "Elif Şahin" },
        { id: "M1D005", fullName: "Burak Özdemir" }
    ],
    M2: [
        { id: "M2D001", fullName: "İbrahim Kaya" },
        { id: "M2D002", fullName: "Selin Arslan" },
        { id: "M2D003", fullName: "Emre Çetin" },
        { id: "M2D004", fullName: "Merve Doğan" },
        { id: "M2D005", fullName: "Ozan Güneş" }
    ],
    M3: [
        { id: "M3D001", fullName: "Deniz Korkmaz" },
        { id: "M3D002", fullName: "Canan Erdoğan" },
        { id: "M3D003", fullName: "Serkan Tekin" },
        { id: "M3D004", fullName: "Melis Yalçın" },
        { id: "M3D005", fullName: "Cem Aksoy" }
    ],
    M4: [
        { id: "M4D001", fullName: "Tolga Demirci" },
        { id: "M4D002", fullName: "Esra Kılıç" },
        { id: "M4D003", fullName: "Murat Özkan" },
        { id: "M4D004", fullName: "Seda Avcı" },
        { id: "M4D005", fullName: "Onur Yüksel" }
    ],
    M5: [
        { id: "M5D001", fullName: "Berk Toprak" },
        { id: "M5D002", fullName: "Pınar Aslan" },
        { id: "M5D003", fullName: "Alper Taş" },
        { id: "M5D004", fullName: "Gizem Kurt" },
        { id: "M5D005", fullName: "Umut Çakır" }
    ]
};

async function generateShiftsForWorker(workerId, startDate, endDate, client) {
    // Get worker's shift pattern
    const workerResult = await client.query(
        'SELECT w.shift_pattern_id, sp.work_days, sp.off_days FROM workers w JOIN shift_patterns sp ON w.shift_pattern_id = sp.pattern_id WHERE w.worker_id = $1',
        [workerId]
    );

    if (workerResult.rows.length === 0) {
        console.error(`No worker found with ID: ${workerId}`);
        return;
    }

    const { work_days, off_days } = workerResult.rows[0];
    const cycleLength = work_days + off_days;
    let currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);
    let isMorningShift = true; // Start with morning shift
    let dayInCycle = 0;
    let cycleStartDate = new Date(currentDate);

    while (currentDate <= endDateTime) {
        const isWorkDay = dayInCycle < work_days;
        const shiftType = isWorkDay ? (isMorningShift ? 'MORNING' : 'NIGHT') : 'OFF';

        await client.query(
            'INSERT INTO shifts (worker_id, shift_date, shift_type, cycle_start_date) VALUES ($1, $2, $3, $4) ON CONFLICT (worker_id, shift_date) DO NOTHING',
            [workerId, currentDate.toISOString().split('T')[0], shiftType, cycleStartDate.toISOString().split('T')[0]]
        );

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        dayInCycle++;

        // Check if cycle is complete
        if (dayInCycle >= cycleLength) {
            dayInCycle = 0;
            cycleStartDate = new Date(currentDate);
            isMorningShift = !isMorningShift; // Alternate between morning and night shifts for each cycle
        }
    }
}

async function populateDatabase() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert metro lines
        for (const [lineId, drivers] of Object.entries(metroDrivers)) {
            await client.query(
                'INSERT INTO metro_lines (line_id, line_name) VALUES ($1, $2) ON CONFLICT (line_id) DO NOTHING',
                [lineId, `Metro Line ${lineId}`]
            );
        }

        // Insert shift patterns
        const shiftPatterns = [
            ['4_2', 4, 2, '4 days work + 2 days off'],
            ['5_2', 5, 2, '5 days work + 2 days off'],
            ['6_1', 6, 1, '6 days work + 1 day off']
        ];

        for (const [patternId, workDays, offDays, description] of shiftPatterns) {
            await client.query(
                'INSERT INTO shift_patterns (pattern_id, work_days, off_days, description) VALUES ($1, $2, $3, $4) ON CONFLICT (pattern_id) DO NOTHING',
                [patternId, workDays, offDays, description]
            );
        }

        // Insert workers
        let workerIndex = 0;
        for (const [lineId, drivers] of Object.entries(metroDrivers)) {
            for (const driver of drivers) {
                const shiftPattern = getShiftPattern(workerIndex);
                await client.query(
                    'INSERT INTO workers (worker_id, full_name, metro_line_id, shift_pattern_id) VALUES ($1, $2, $3, $4) ON CONFLICT (worker_id) DO NOTHING',
                    [driver.id, driver.fullName, lineId, shiftPattern]
                );
                workerIndex++;
            }
        }

        // Generate shifts for the next 90 days for all workers
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 90);

        const workers = await client.query('SELECT worker_id FROM workers WHERE is_active = true');
        for (const worker of workers.rows) {
            await generateShiftsForWorker(worker.worker_id, startDate, endDate, client);
        }

        await client.query('COMMIT');
        console.log('Database populated successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error populating database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the population script
populateDatabase().catch(console.error); 