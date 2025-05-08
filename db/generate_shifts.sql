-- Function to generate shifts for a worker based on their pattern
CREATE OR REPLACE FUNCTION generate_worker_shifts(
    p_worker_id VARCHAR(10),
    p_start_date DATE,
    p_end_date DATE
) RETURNS void AS $$
DECLARE
    v_pattern_id VARCHAR(3);
    v_work_days INTEGER;
    v_off_days INTEGER;
    v_current_date DATE;
    v_cycle_start DATE;
    v_day_in_cycle INTEGER;
    v_is_work_day BOOLEAN;
    v_shift_type VARCHAR(10);
    v_is_morning BOOLEAN;
BEGIN
    -- Get worker's shift pattern
    SELECT shift_pattern_id, work_days, off_days
    INTO v_pattern_id, v_work_days, v_off_days
    FROM workers w
    JOIN shift_patterns sp ON w.shift_pattern_id = sp.pattern_id
    WHERE w.worker_id = p_worker_id;

    v_current_date := p_start_date;
    v_cycle_start := p_start_date;
    v_day_in_cycle := 0;
    v_is_morning := TRUE; -- Start with morning shift

    WHILE v_current_date <= p_end_date LOOP
        -- Calculate if it's a work day
        v_is_work_day := v_day_in_cycle < v_work_days;
        
        -- Determine shift type
        IF v_is_work_day THEN
            v_shift_type := CASE WHEN v_is_morning THEN 'MORNING' ELSE 'NIGHT' END;
        ELSE
            v_shift_type := 'OFF';
        END IF;

        -- Insert shift
        INSERT INTO shifts (worker_id, shift_date, shift_type, cycle_start_date)
        VALUES (p_worker_id, v_current_date, v_shift_type, v_cycle_start)
        ON CONFLICT (worker_id, shift_date) DO NOTHING;

        -- Update counters
        v_current_date := v_current_date + 1;
        v_day_in_cycle := v_day_in_cycle + 1;

        -- Check if we need to start a new cycle
        IF v_day_in_cycle >= (v_work_days + v_off_days) THEN
            v_day_in_cycle := 0;
            v_cycle_start := v_current_date;
            v_is_morning := NOT v_is_morning; -- Alternate between morning and night shifts
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate shifts for all active workers for the next 90 days
DO $$
DECLARE
    v_worker RECORD;
BEGIN
    FOR v_worker IN SELECT worker_id FROM workers WHERE is_active = true
    LOOP
        PERFORM generate_worker_shifts(
            v_worker.worker_id,
            CURRENT_DATE,
            CURRENT_DATE + 90
        );
    END LOOP;
END;
$$; 