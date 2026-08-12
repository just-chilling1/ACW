-- Remove exact duplicate saved offers (same user + url), keep newest.
DELETE FROM dfy_offers a
USING dfy_offers b
WHERE a.user_id = b.user_id
  AND a.url = b.url
  AND a.updated_at < b.updated_at;

DELETE FROM dfy_offers a
USING dfy_offers b
WHERE a.user_id = b.user_id
  AND a.url = b.url
  AND a.updated_at = b.updated_at
  AND a.id < b.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dfy_offers_user_url
    ON dfy_offers (user_id, url);
