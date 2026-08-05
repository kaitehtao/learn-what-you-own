UPDATE dossier_expansion_batches
SET selection_rule='Active constituents ranked by the latest available Nasdaq market capitalization; null values sort last. Rank refreshes automatically and ticker breaks ties.',
    status='in_progress',updated_at=CURRENT_TIMESTAMP
WHERE id='russell-2000-market-cap-01';
