const pool = require('./config');

// Distribute shift patterns evenly among workers
const getShiftPattern = (index) => {
    const patterns = ['4_2', '5_2', '6_1'];
    return patterns[index % patterns.length];
};

const metroDrivers = {
    M1: [
        { id: "M1D001", fullName: "Ahmet Yılmaz" },
        { id: "M1D002", fullName: "Mehmet Demir" },
        { id: "M1D003", fullName: "Ayşe Kara" },
        { id: "M1D004", fullName: "Fatma Çelik" },
        { id: "M1D005", fullName: "Ali Öztürk" }
    ],
    M2: [
        { id: "M2D001", fullName: "Mehmet Yılmaz" },
        { id: "M2D002", fullName: "Ayşe Demir" },
        { id: "M2D003", fullName: "Ali Kara" },
        { id: "M2D004", fullName: "Fatma Çelik" },
        { id: "M2D005", fullName: "Ahmet Öztürk" }
    ],
    M3: [
        { id: "M3D001", fullName: "Ali Yılmaz" },
        { id: "M3D002", fullName: "Ayşe Demir" },
        { id: "M3D003", fullName: "Mehmet Kara" },
        { id: "M3D004", fullName: "Fatma Çelik" },
        { id: "M3D005", fullName: "Ahmet Öztürk" }
    ],
    M4: [
        { id: "M4D001", fullName: "Ahmet Yılmaz" },
        { id: "M4D002", fullName: "Ayşe Demir" },
        { id: "M4D003", fullName: "Mehmet Kara" },
        { id: "M4D004", fullName: "Fatma Çelik" },
        { id: "M4D005", fullName: "Ali Öztürk" }
    ],
    M5: [
        { id: "M5D001", fullName: "Ahmet Yılmaz" },
        { id: "M5D002", fullName: "Ayşe Demir" },
        { id: "M5D003", fullName: "Mehmet Kara" },
        { id: "M5D004", fullName: "Fatma Çelik" },
        { id: "M5D005", fullName: "Ali Öztürk" }
    ]
};

async function migrateData() {
    try {
        // Insert metro lines
        const metroLines = ['M1', 'M2', 'M3', 'M4', 'M5'];
        for (const line of metroLines) {
            await pool.query(
                'INSERT INTO metro_lines (line_id, line_name) VALUES ($1, $2) ON CONFLICT (line_id) DO NOTHING',
                [line, `Metro Line ${line}`]
            );
        }

        // Insert workers with shift patterns
        let workerIndex = 0;
        for (const [line, drivers] of Object.entries(metroDrivers)) {
            for (const driver of drivers) {
                const shiftPattern = getShiftPattern(workerIndex);
                await pool.query(
                    'INSERT INTO workers (worker_id, full_name, metro_line_id, shift_pattern_id) VALUES ($1, $2, $3, $4) ON CONFLICT (worker_id) DO NOTHING',
                    [driver.id, driver.fullName, line, shiftPattern]
                );
                workerIndex++;
            }
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await pool.end();
    }
}

migrateData(); 