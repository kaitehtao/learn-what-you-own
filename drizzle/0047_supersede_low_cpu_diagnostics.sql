-- The former 100 ms Worker CPU ceiling terminated otherwise valid SEC and AI
-- profile jobs. Preserve those records for audit while allowing a clean retry
-- under the bounded 30-second pipeline.
UPDATE dossier_narrative_enrichment_jobs
SET status='superseded_low_cpu',updated_at=CURRENT_TIMESTAMP
WHERE status='timed_out'
  AND error_message='The Worker invocation ended before a validated result was recorded.';

UPDATE company_profile_refresh_jobs
SET status='superseded_low_cpu',updated_at=CURRENT_TIMESTAMP
WHERE status='error' AND error_message='Worker invocation timed out.';
