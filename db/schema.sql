-- Drop existing tables in correct order (dependent tables first)
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS workers;
DROP TABLE IF EXISTS metro_lines;
DROP TABLE IF EXISTS shift_patterns;

-- Create metro_lines table
CREATE TABLE IF NOT EXISTS metro_lines (
    line_id VARCHAR(3) PRIMARY KEY,
    line_name VARCHAR(50) NOT NULL
);

-- Create shift_patterns table
CREATE TABLE IF NOT EXISTS shift_patterns (
    pattern_id VARCHAR(3) PRIMARY KEY,
    work_days INTEGER NOT NULL,
    off_days INTEGER NOT NULL,
    description VARCHAR(50)
);

-- Insert shift patterns
INSERT INTO shift_patterns (pattern_id, work_days, off_days, description) VALUES
    ('4_2', 4, 2, '4 days work + 2 days off'),
    ('5_2', 5, 2, '5 days work + 2 days off'),
    ('6_1', 6, 1, '6 days work + 1 day off');

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
    worker_id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    metro_line_id VARCHAR(3) REFERENCES metro_lines(line_id),
    shift_pattern_id VARCHAR(3) REFERENCES shift_patterns(pattern_id),
    is_active BOOLEAN DEFAULT true
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
    shift_id SERIAL PRIMARY KEY,
    worker_id VARCHAR(10) REFERENCES workers(worker_id),
    shift_date DATE NOT NULL,
    shift_type VARCHAR(10) CHECK (shift_type IN ('MORNING', 'NIGHT', 'OFF')),
    cycle_start_date DATE NOT NULL, -- To track the start of each work cycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, shift_date)
); 