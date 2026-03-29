-- Travel planning workflow + commission reports

ALTER TABLE planning_requests
  ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'DRAFT'
    CHECK (workflow_status IN ('DRAFT','SENT','VALIDATED','BOOKED','CANCELLED')),
  ADD COLUMN IF NOT EXISTS itinerary_items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(5,2) DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS services_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS final_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS booked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS commission_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES providers(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_bookings INT DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_commission NUMERIC(10,2) DEFAULT 0,
  pdf_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'generated'
    CHECK (status IN ('generated','sent','acknowledged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS commission_reports_provider_period_idx
  ON commission_reports(provider_id, period_start);

ALTER TABLE commission_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Commission reports admin only" ON commission_reports;
CREATE POLICY "Commission reports admin only"
  ON commission_reports FOR ALL
  USING (FALSE);

-- Do not expose rows to anon clients by token alone. Public reads use Express (service role).
DROP POLICY IF EXISTS "Public token access to planning" ON planning_requests;
CREATE POLICY "Public token access to planning"
  ON planning_requests FOR SELECT
  USING (false);

