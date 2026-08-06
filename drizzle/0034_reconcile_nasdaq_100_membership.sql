-- Reconcile the active Nasdaq-100 membership snapshot with Nasdaq's official
-- component endpoint as of 2026-08-05. EA is no longer present in that feed.
UPDATE companies
SET memberships_json = '["S&P 500","Russell 3000"]',
    index_weights_json = '{"S&P 500":0.07,"Russell 3000":0.08}',
    updated_at = CURRENT_TIMESTAMP
WHERE ticker = 'EA'
  AND memberships_json LIKE '%Nasdaq-100 (QQQ)%';
