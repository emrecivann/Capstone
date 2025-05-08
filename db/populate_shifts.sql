-- Populate shifts table with sample data
-- This will create shifts for the next 30 days with balanced morning and night shifts each day

-- First, let's get all active workers
WITH RECURSIVE dates AS (
    SELECT CURRENT_DATE AS date
    UNION ALL
    SELECT date + 1
    FROM dates
    WHERE date < CURRENT_DATE + 29
),
numbered_workers AS (
    SELECT 
        worker_id,
        ROW_NUMBER() OVER (ORDER BY worker_id) as worker_num
    FROM workers
    WHERE is_active = true
),
worker_shifts AS (
    SELECT 
        w.worker_id,
        d.date as shift_date,
        CASE 
            -- Alternate workers between morning and night shifts
            -- If worker_num is odd, they start with morning shift and alternate
            -- If worker_num is even, they start with night shift and alternate
            WHEN w.worker_num % 2 = 1 THEN
                CASE WHEN EXTRACT(DAY FROM d.date) % 2 = 1 THEN 'MORNING' ELSE 'NIGHT' END
            ELSE
                CASE WHEN EXTRACT(DAY FROM d.date) % 2 = 1 THEN 'NIGHT' ELSE 'MORNING' END
        END as shift_type
    FROM numbered_workers w
    CROSS JOIN dates d
)
INSERT INTO shifts (worker_id, shift_date, shift_type)
SELECT 
    worker_id,
    shift_date,
    shift_type
FROM worker_shifts
ON CONFLICT (worker_id, shift_date) DO NOTHING;

-- This will create shifts for the next 30 days
-- Each day will have a balanced mix of morning and night shifts
-- Workers alternate between morning and night shifts on consecutive days
-- The script uses ON CONFLICT DO NOTHING to avoid duplicate entries 