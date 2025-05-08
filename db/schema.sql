-- Create metro_lines table
CREATE TABLE IF NOT EXISTS metro_lines (
    line_id VARCHAR(3) PRIMARY KEY,
    line_name VARCHAR(50) NOT NULL
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
    worker_id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    metro_line_id VARCHAR(3) REFERENCES metro_lines(line_id),
    is_active BOOLEAN DEFAULT true
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
    shift_id SERIAL PRIMARY KEY,
    worker_id VARCHAR(10) REFERENCES workers(worker_id),
    shift_date DATE NOT NULL,
    shift_type VARCHAR(10) CHECK (shift_type IN ('MORNING', 'NIGHT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, shift_date)
); 