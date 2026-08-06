-- Hosted projects can apply broad default privileges to new public tables.
-- Replace them with the exact Data API permissions required by this feature;
-- RLS remains the per-row authorization boundary.

revoke all on public.earnings_model_submissions, public.earnings_model_cells, public.earnings_model_revisions from anon, authenticated;
grant select, insert, update, delete on public.earnings_model_submissions, public.earnings_model_cells to authenticated;
grant select, insert on public.earnings_model_revisions to authenticated;

revoke all on sequence public.earnings_model_submissions_id_seq, public.earnings_model_cells_id_seq, public.earnings_model_revisions_id_seq from anon, authenticated;
grant usage, select on sequence public.earnings_model_submissions_id_seq, public.earnings_model_cells_id_seq, public.earnings_model_revisions_id_seq to authenticated;
