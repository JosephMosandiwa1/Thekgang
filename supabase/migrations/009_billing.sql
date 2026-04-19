-- ============================================================================
-- 009_billing.sql
--
-- Membership billing + Paystack integration:
--   - member_subscriptions   one per member, tracks current subscription state
--   - member_payments        immutable ledger of every payment received
--   - paystack_events        raw webhook inbox (for audit + retry on failures)
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_subscriptions (
  id                SERIAL PRIMARY KEY,
  member_id         INT NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
  tier_id           INT NOT NULL REFERENCES member_tiers(id) ON DELETE RESTRICT,

  status            TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'past_due', 'cancelled', 'expired')),
  started_at        DATE,
  expires_at        DATE,
  auto_renew        BOOLEAN DEFAULT TRUE,

  last_payment_at   TIMESTAMPTZ,
  last_payment_id   INT,
  next_renewal_at   DATE,

  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  paystack_authorization_code TEXT,     -- tokenised card for future charges

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msubs_status ON member_subscriptions(status);

CREATE TABLE IF NOT EXISTS member_payments (
  id                SERIAL PRIMARY KEY,
  member_id         INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  subscription_id   INT REFERENCES member_subscriptions(id) ON DELETE SET NULL,
  tier_id           INT REFERENCES member_tiers(id) ON DELETE SET NULL,

  amount_rands      NUMERIC(10, 2) NOT NULL,
  currency          TEXT DEFAULT 'ZAR',
  status            TEXT NOT NULL
    CHECK (status IN ('initiated', 'success', 'failed', 'refunded', 'disputed')),

  paystack_reference TEXT UNIQUE,
  paystack_transaction_id TEXT,
  channel           TEXT,                           -- card / eft / transfer
  paid_at           TIMESTAMPTZ,

  invoice_number    TEXT UNIQUE,
  receipt_url       TEXT,
  notes             TEXT,

  raw_response      JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mpays_member ON member_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_mpays_ref ON member_payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_mpays_status ON member_payments(status);

-- Paystack webhook event log (audit trail, retry source)
CREATE TABLE IF NOT EXISTS paystack_events (
  id                SERIAL PRIMARY KEY,
  event_type        TEXT NOT NULL,
  paystack_reference TEXT,
  payload           JSONB NOT NULL,
  processed         BOOLEAN DEFAULT FALSE,
  processed_at      TIMESTAMPTZ,
  error             TEXT,
  received_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pse_type ON paystack_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pse_processed ON paystack_events(processed);

-- Invoice number generator
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TRIGGER AS $INV$
DECLARE
  year_part TEXT;
  next_num INT;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-' || year_part || '-(\d+)') AS INT)), 0) + 1
      INTO next_num
      FROM member_payments
      WHERE invoice_number LIKE 'INV-' || year_part || '-%';
    NEW.invoice_number := 'INV-' || year_part || '-' || LPAD(next_num::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$INV$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gen_invoice_num ON member_payments;
CREATE TRIGGER trg_gen_invoice_num
  BEFORE INSERT ON member_payments
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION generate_invoice_number();

-- Updated-at triggers
DROP TRIGGER IF EXISTS trg_msubs_touch ON member_subscriptions;
CREATE TRIGGER trg_msubs_touch BEFORE UPDATE ON member_subscriptions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS: members see only their own payments + subscription
ALTER TABLE member_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msubs_own ON member_subscriptions;
CREATE POLICY msubs_own ON member_subscriptions
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );

ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mpay_own ON member_payments;
CREATE POLICY mpay_own ON member_payments
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );
