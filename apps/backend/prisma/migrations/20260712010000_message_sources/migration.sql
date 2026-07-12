-- Assistant replies persist the sources that grounded them (ChatSource[]
-- as JSONB) so the chat footnote survives history reloads. Null for user
-- messages and for replies generated before this column existed.
ALTER TABLE ai.messages ADD COLUMN IF NOT EXISTS sources JSONB;
