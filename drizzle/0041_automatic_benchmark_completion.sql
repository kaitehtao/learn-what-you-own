-- Benchmark completion is now an auditable evidence rule rather than a
-- per-ticker editorial approval gate. Existing unfinished batches are retained
-- and will be consumed by the scheduled automatic validator.
UPDATE dossier_completion_batches
SET status='automatic_validation'
WHERE status='editorial_review';

-- Close legacy batches that have no candidate left for the validator to
-- consume. Their approved and exception records remain available as history.
UPDATE dossier_completion_batches
SET status='completed',
    completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP)
WHERE NOT EXISTS (
  SELECT 1 FROM dossier_completion_candidates candidate
  WHERE candidate.batch_id=dossier_completion_batches.id
    AND candidate.status IN ('evidence_packet_ready','editorial_review')
);
