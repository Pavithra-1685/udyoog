-- Update schema for Jobs (Positions) and Companies as per latest requirements

-- Add new columns to positions (Jobs)
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK (status IN ('open', 'close', 'hold')),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS salary TEXT;

-- Update activities table to ensure date defaults to today
ALTER TABLE activities 
ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- Add action_date to positions if needed for "today automatically"
-- Actually, positions already has created_at which defaults to NOW()

-- Add action_item to companies if they want an initial one there
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS action_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS action_item TEXT;

-- Index for new columns
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
