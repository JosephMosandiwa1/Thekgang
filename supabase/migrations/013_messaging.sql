-- ============================================================================
-- 013_messaging.sql
--
-- Member-to-member direct messaging.
-- Thread-based (one thread per pair of members). Polling-based reads.
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_message_threads (
  id                SERIAL PRIMARY KEY,
  member_a_id       INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_b_id       INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  subject           TEXT,
  last_message_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure only one thread per unordered pair
  CHECK (member_a_id <> member_b_id)
);
-- Unique pair index — always store with member_a < member_b
CREATE UNIQUE INDEX IF NOT EXISTS idx_thread_pair ON member_message_threads (LEAST(member_a_id, member_b_id), GREATEST(member_a_id, member_b_id));

CREATE TABLE IF NOT EXISTS member_messages (
  id                SERIAL PRIMARY KEY,
  thread_id         INT NOT NULL REFERENCES member_message_threads(id) ON DELETE CASCADE,
  from_member_id    INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_member_id      INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  body              TEXT NOT NULL,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_thread ON member_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_msg_recipient ON member_messages(to_member_id, read_at);

-- RLS: members can only see threads + messages where they're a participant
ALTER TABLE member_message_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_threads_own ON member_message_threads;
CREATE POLICY msg_threads_own ON member_message_threads
  FOR SELECT USING (
    member_a_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR member_b_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );

ALTER TABLE member_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS msg_own ON member_messages;
CREATE POLICY msg_own ON member_messages
  FOR SELECT USING (
    from_member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR to_member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
    OR auth.jwt() ->> 'role' = 'service_role'
  );
DROP POLICY IF EXISTS msg_insert_own ON member_messages;
CREATE POLICY msg_insert_own ON member_messages
  FOR INSERT WITH CHECK (
    from_member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
  );
