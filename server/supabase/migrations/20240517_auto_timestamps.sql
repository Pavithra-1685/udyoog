-- 1. Add updated_at to relevant tables if not exists
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE positions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create function to update updated_at AND business dates
CREATE OR REPLACE FUNCTION update_timestamps_and_dates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Automatically set business date fields to CURRENT_DATE on update
    IF TG_TABLE_NAME = 'companies' THEN
        NEW.action_date = CURRENT_DATE;
    ELSIF TG_TABLE_NAME = 'activities' THEN
        NEW.date = CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create triggers for each table
DROP TRIGGER IF EXISTS update_companies_timestamps ON companies;
CREATE TRIGGER update_companies_timestamps BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE update_timestamps_and_dates();

DROP TRIGGER IF EXISTS update_positions_timestamps ON positions;
CREATE TRIGGER update_positions_timestamps BEFORE UPDATE ON positions FOR EACH ROW EXECUTE PROCEDURE update_timestamps_and_dates();

DROP TRIGGER IF EXISTS update_activities_timestamps ON activities;
CREATE TRIGGER update_activities_timestamps BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE update_timestamps_and_dates();
